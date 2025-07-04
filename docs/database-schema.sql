-- CrowdPollen Database Schema
-- Run this in your Supabase SQL editor to set up the database

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create users table (extends Supabase auth.users)
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  notification_preferences JSONB DEFAULT '{"symptom_reminders": true, "high_pollen_alerts": true}'::jsonb,
  privacy_level TEXT DEFAULT 'anonymous' CHECK (privacy_level IN ('anonymous', 'identified', 'research_participant')),
  allergen_profile JSONB,
  total_submissions INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_submission TIMESTAMP WITH TIME ZONE,
  achievement_badges JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  account_type TEXT DEFAULT 'individual' CHECK (account_type IN ('individual', 'educator', 'researcher', 'organization'))
);

-- Create submissions table
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Images
  image_card_url TEXT NOT NULL,
  image_env_url TEXT,
  image_metadata JSONB,
  
  -- Location & Time
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  zip_code VARCHAR(10),
  address TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  collection_start TIMESTAMP WITH TIME ZONE,
  collection_end TIMESTAMP WITH TIME ZONE,
  
  -- Results
  pollen_density TEXT CHECK (pollen_density IN ('very_low', 'low', 'moderate', 'high', 'very_high')),
  pollen_count INTEGER,
  confidence_score DECIMAL(3,2),
  plant_species JSONB,
  
  -- Context
  weather_data JSONB,
  user_symptoms JSONB,
  notes TEXT,
  
  -- Quality Control
  quality_score DECIMAL(3,2),
  human_verified BOOLEAN DEFAULT FALSE,
  flagged BOOLEAN DEFAULT FALSE,
  flagged_reason TEXT,
  is_anonymous BOOLEAN DEFAULT TRUE,
  
  -- Google Pollen API Validation
  google_validation_status TEXT CHECK (google_validation_status IN ('validated', 'variance', 'significant_variance', 'no_data', 'error')),
  google_forecast_data JSONB,
  variance_from_forecast DECIMAL(5,2),
  validation_notes TEXT,
  validation_timestamp TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Google Pollen forecasts table
CREATE TABLE google_pollen_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  forecast_date DATE NOT NULL,
  region_code TEXT,
  
  -- Pollen type data (GRASS, TREE, WEED)
  grass_index INTEGER,
  grass_category TEXT,
  grass_display_name TEXT,
  tree_index INTEGER,
  tree_category TEXT,
  tree_display_name TEXT,
  weed_index INTEGER,
  weed_category TEXT,
  weed_display_name TEXT,
  
  -- Plant-specific data
  plant_info JSONB,
  health_recommendations JSONB,
  
  -- Metadata
  data_source TEXT DEFAULT 'google_pollen_api',
  raw_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(latitude, longitude, forecast_date)
);

-- Create locations table for aggregated data
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  zip_code VARCHAR(10),
  location_type TEXT,
  avg_pollen_density DECIMAL(3,2),
  total_submissions INTEGER DEFAULT 0,
  last_update TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('pollen_alert', 'symptom_reminder', 'achievement', 'system')),
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_submissions_location ON submissions USING GIST (ST_MakePoint(longitude, latitude));
CREATE INDEX idx_submissions_time ON submissions (submitted_at DESC);
CREATE INDEX idx_submissions_zip ON submissions(zip_code);
CREATE INDEX idx_submissions_user ON submissions(user_id);
CREATE INDEX idx_submissions_density ON submissions(pollen_density);
CREATE INDEX idx_submissions_validation ON submissions(google_validation_status);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;

-- Create indexes for Google Pollen forecasts
CREATE INDEX idx_google_forecasts_location_date ON google_pollen_forecasts 
  USING GIST (ST_MakePoint(longitude, latitude));
CREATE INDEX idx_google_forecasts_forecast_date ON google_pollen_forecasts (forecast_date);
CREATE INDEX idx_google_forecasts_expires ON google_pollen_forecasts (expires_at);
CREATE INDEX idx_google_forecasts_date ON google_pollen_forecasts (forecast_date DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to submissions table
CREATE TRIGGER update_submissions_updated_at 
  BEFORE UPDATE ON submissions
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to update user submission count
CREATE OR REPLACE FUNCTION update_user_submission_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_profiles 
    SET 
      total_submissions = total_submissions + 1,
      last_submission = NEW.created_at
    WHERE user_id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_profiles 
    SET total_submissions = total_submissions - 1
    WHERE user_id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Apply trigger for user submission counting
CREATE TRIGGER update_user_stats_trigger
  AFTER INSERT OR DELETE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_submission_count();

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_pollen_forecasts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for submissions
CREATE POLICY "Anyone can view submissions" ON submissions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create submissions" ON submissions
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL OR 
    (auth.uid() IS NULL AND is_anonymous = true)
  );

CREATE POLICY "Users can update own submissions" ON submissions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own submissions" ON submissions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for locations (read-only for users)
CREATE POLICY "Anyone can view locations" ON locations
  FOR SELECT USING (true);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for Google Pollen forecasts (read-only for users)
CREATE POLICY "Anyone can view Google forecasts" ON google_pollen_forecasts
  FOR SELECT USING (true);

-- Create view for public submission data (without sensitive info)
CREATE VIEW public_submissions AS
SELECT 
  id,
  latitude,
  longitude,
  zip_code,
  address,
  submitted_at,
  pollen_density,
  pollen_count,
  confidence_score,
  weather_data,
  created_at
FROM submissions
WHERE flagged = false AND human_verified = true;

-- Create function to get nearby submissions
CREATE OR REPLACE FUNCTION get_nearby_submissions(
  user_lat DECIMAL,
  user_lon DECIMAL,
  radius_km INTEGER DEFAULT 50,
  limit_count INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  latitude DECIMAL,
  longitude DECIMAL,
  pollen_density TEXT,
  pollen_count INTEGER,
  confidence_score DECIMAL,
  submitted_at TIMESTAMP WITH TIME ZONE,
  distance_km DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.latitude,
    s.longitude,
    s.pollen_density,
    s.pollen_count,
    s.confidence_score,
    s.submitted_at,
    ROUND(
      ST_Distance(
        ST_MakePoint(user_lon, user_lat)::geography,
        ST_MakePoint(s.longitude, s.latitude)::geography
      ) / 1000, 2
    ) as distance_km
  FROM submissions s
  WHERE 
    s.flagged = false 
    AND ST_DWithin(
      ST_MakePoint(user_lon, user_lat)::geography,
      ST_MakePoint(s.longitude, s.latitude)::geography,
      radius_km * 1000
    )
  ORDER BY distance_km ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get pollen trends
CREATE OR REPLACE FUNCTION get_pollen_trends(
  days_back INTEGER DEFAULT 7,
  user_lat DECIMAL DEFAULT NULL,
  user_lon DECIMAL DEFAULT NULL,
  radius_km INTEGER DEFAULT 50
)
RETURNS TABLE (
  date DATE,
  avg_pollen_count DECIMAL,
  dominant_density TEXT,
  submission_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(s.submitted_at) as date,
    ROUND(AVG(s.pollen_count), 1) as avg_pollen_count,
    MODE() WITHIN GROUP (ORDER BY s.pollen_density) as dominant_density,
    COUNT(*) as submission_count
  FROM submissions s
  WHERE 
    s.submitted_at >= CURRENT_DATE - INTERVAL '1 day' * days_back
    AND s.flagged = false
    AND s.pollen_count IS NOT NULL
    AND (
      user_lat IS NULL OR 
      ST_DWithin(
        ST_MakePoint(user_lon, user_lat)::geography,
        ST_MakePoint(s.longitude, s.latitude)::geography,
        radius_km * 1000
      )
    )
  GROUP BY DATE(s.submitted_at)
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate user streaks
CREATE OR REPLACE FUNCTION calculate_user_streak(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  streak_count INTEGER := 0;
  current_date DATE := CURRENT_DATE;
  check_date DATE;
BEGIN
  -- Start from yesterday and count backwards
  check_date := current_date - INTERVAL '1 day';
  
  LOOP
    -- Check if user has submission on this date
    IF EXISTS (
      SELECT 1 FROM submissions 
      WHERE user_id = user_uuid 
      AND DATE(submitted_at) = check_date
    ) THEN
      streak_count := streak_count + 1;
      check_date := check_date - INTERVAL '1 day';
    ELSE
      EXIT; -- Break the loop if no submission found
    END IF;
  END LOOP;
  
  RETURN streak_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to award achievements
CREATE OR REPLACE FUNCTION check_and_award_achievements(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  user_data RECORD;
  new_badges JSONB := '[]'::jsonb;
  current_badges JSONB;
BEGIN
  -- Get user data
  SELECT * INTO user_data FROM user_profiles WHERE user_id = user_uuid;
  
  IF user_data IS NULL THEN
    RETURN new_badges;
  END IF;
  
  current_badges := COALESCE(user_data.achievement_badges, '[]'::jsonb);
  
  -- First submission badge
  IF user_data.total_submissions >= 1 AND NOT current_badges ? 'first_submission' THEN
    new_badges := new_badges || '["first_submission"]'::jsonb;
  END IF;
  
  -- Regular contributor badge (10 submissions)
  IF user_data.total_submissions >= 10 AND NOT current_badges ? 'regular_contributor' THEN
    new_badges := new_badges || '["regular_contributor"]'::jsonb;
  END IF;
  
  -- Dedicated researcher badge (50 submissions)
  IF user_data.total_submissions >= 50 AND NOT current_badges ? 'dedicated_researcher' THEN
    new_badges := new_badges || '["dedicated_researcher"]'::jsonb;
  END IF;
  
  -- Streak badges
  IF user_data.streak_days >= 7 AND NOT current_badges ? 'week_streak' THEN
    new_badges := new_badges || '["week_streak"]'::jsonb;
  END IF;
  
  IF user_data.streak_days >= 30 AND NOT current_badges ? 'month_streak' THEN
    new_badges := new_badges || '["month_streak"]'::jsonb;
  END IF;
  
  -- Update user badges if new ones were earned
  IF jsonb_array_length(new_badges) > 0 THEN
    UPDATE user_profiles 
    SET achievement_badges = current_badges || new_badges
    WHERE user_id = user_uuid;
  END IF;
  
  RETURN new_badges;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update streaks and check achievements
CREATE OR REPLACE FUNCTION update_user_streaks_and_achievements()
RETURNS TRIGGER AS $$
DECLARE
  new_streak INTEGER;
  new_badges JSONB;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.user_id IS NOT NULL THEN
    -- Calculate new streak
    new_streak := calculate_user_streak(NEW.user_id);
    
    -- Update user streak
    UPDATE user_profiles 
    SET streak_days = new_streak
    WHERE user_id = NEW.user_id;
    
    -- Check for new achievements
    new_badges := check_and_award_achievements(NEW.user_id);
    
    -- Create notifications for new badges
    IF jsonb_array_length(new_badges) > 0 THEN
      INSERT INTO notifications (user_id, title, message, type, data)
      VALUES (
        NEW.user_id,
        'Achievement Unlocked!',
        'You''ve earned new badges for your contributions.',
        'achievement',
        jsonb_build_object('badges', new_badges)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply achievement trigger
CREATE TRIGGER update_streaks_and_achievements_trigger
  AFTER INSERT ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_streaks_and_achievements();

-- Insert sample data (optional - remove in production)
-- This creates some test locations and submissions for development

-- Sample locations
INSERT INTO locations (name, address, latitude, longitude, zip_code, location_type) VALUES
('Central Park', 'New York, NY', 40.7829, -73.9654, '10024', 'park'),
('Golden Gate Park', 'San Francisco, CA', 37.7694, -122.4862, '94117', 'park'),
('Millennium Park', 'Chicago, IL', 41.8826, -87.6226, '60601', 'park'),
('Balboa Park', 'San Diego, CA', 32.7341, -117.1443, '92101', 'park'),
('Piedmont Park', 'Atlanta, GA', 33.7879, -84.3733, '30309', 'park');

-- Sample submissions (anonymous)
INSERT INTO submissions (
  image_card_url, 
  latitude, 
  longitude, 
  zip_code, 
  pollen_density, 
  pollen_count, 
  confidence_score,
  is_anonymous,
  human_verified
) VALUES
('https://example.com/sample1.jpg', 40.7829, -73.9654, '10024', 'moderate', 25, 0.85, true, true),
('https://example.com/sample2.jpg', 37.7694, -122.4862, '94117', 'high', 45, 0.92, true, true),
('https://example.com/sample3.jpg', 41.8826, -87.6226, '60601', 'low', 8, 0.78, true, true),
('https://example.com/sample4.jpg', 32.7341, -117.1443, '92101', 'very_high', 67, 0.89, true, true),
('https://example.com/sample5.jpg', 33.7879, -84.3733, '30309', 'moderate', 32, 0.81, true, true);

-- Create storage bucket policy (run this in Supabase dashboard)
-- This allows public read access to the pollen-images bucket
/*
INSERT INTO storage.buckets (id, name, public) VALUES ('pollen-images', 'pollen-images', true);

CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'pollen-images');

CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'pollen-images' AND 
  (auth.uid() IS NOT NULL OR auth.uid() IS NULL)
);

CREATE POLICY "Users can update own files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'pollen-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'pollen-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
*/
