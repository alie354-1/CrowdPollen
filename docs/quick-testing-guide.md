# 🧪 Quick Testing Guide

## Why Mock Data?

Mock forecasts allow you to:

- **Test immediately** without API keys
- **Develop offline** without internet dependency  
- **Control costs** during development (Google Pollen API costs $0.50 per 1,000 requests)
- **Get consistent results** for testing UI components
- **Work reliably** without rate limits or API downtime

## 🚀 Getting Started (2 minutes)

### 1. Start the App
```bash
npm run dev
```

### 2. Test API Setup
1. Go to **Settings** (gear icon in bottom navigation)
2. Scroll to **Developer Tools** section
3. Click **"API Test Panel"**
4. Click **"🧪 Test All APIs"**

You'll see:
- ✅ **Green**: API working with real data
- 🔄 **Yellow**: Using mock data (no API key)
- ❌ **Red**: Configuration error

### 3. Add API Keys (Optional)

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` and add your keys:
```env
# Required for database
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key

# Required for maps and pollen data
VITE_GOOGLE_MAPS_API_KEY=your_google_key

# Optional for AI features
VITE_HUGGINGFACE_API_TOKEN=your_hf_token
```

Restart the dev server:
```bash
npm run dev
```

## 🎯 What Works Without API Keys

### ✅ Fully Functional
- **Pollen Forecasts**: Realistic seasonal mock data
- **Weather Data**: Mock weather conditions
- **Maps**: Basic functionality (limited without Google key)
- **Camera**: Photo capture and storage
- **Symptom Logging**: Full tracking capabilities
- **Data Export**: Download your data
- **Offline Mode**: Service worker caching

### ⚠️ Limited Without Keys
- **Real Pollen Data**: Uses seasonal mock patterns
- **Geocoding**: Limited address lookup
- **AI Detection**: No photo analysis
- **Map Tiles**: Basic tiles only

## 🔧 Testing Features

### Test Pollen Forecasts
1. Go to **Home** screen
2. Set your location (or use mock location)
3. View 5-day forecast with seasonal patterns:
   - **Spring**: High tree pollen
   - **Summer**: High grass pollen  
   - **Fall**: High weed pollen
   - **Winter**: Low all pollen

### Test Camera & Submissions
1. Go to **Camera** screen
2. Take a photo of anything (simulates pollen trap)
3. Add notes and submit
4. View in **History** screen

### Test Maps
1. Go to **Map** screen
2. See your submissions as markers
3. Toggle between different map views

### Test Symptom Logging
1. Go to **Symptoms** screen
2. Log daily symptoms
3. View trends over time

## 📊 Mock Data Details

### Pollen Forecast Mock Data
- **Seasonal Patterns**: Realistic pollen levels by month
- **Multiple Types**: Tree, grass, and weed pollen
- **Plant Information**: Common allergens by season
- **Health Recommendations**: Actionable advice
- **5-Day Forecasts**: Complete forecast data

### Weather Mock Data
- **Current Conditions**: Temperature, humidity, wind
- **Realistic Values**: Based on location and season
- **Weather Icons**: Appropriate conditions

## 🚀 Production Setup

When ready for production:

1. **Get Google Cloud API Key**:
   - Enable Maps, Geocoding, and Pollen APIs
   - Single key works for all Google services

2. **Set up Supabase**:
   - Create project at supabase.com
   - Get URL and anon key

3. **Optional Hugging Face**:
   - For AI pollen detection features
   - Create account at huggingface.co

## 🔍 Troubleshooting

### App Won't Start
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### API Test Fails
1. Check `.env` file exists and has correct keys
2. Restart dev server after adding keys
3. Check browser console for errors
4. Verify API keys are valid

### Mock Data Not Showing
- Mock data is automatic when no API keys present
- Check browser console for JavaScript errors
- Ensure location is set (use test coordinates if needed)

## 📱 Mobile Testing

Test on mobile devices:
1. Find your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Access app at `http://YOUR_IP:5173`
3. Test PWA features (add to home screen)

## 🎉 Success Criteria

You'll know everything is working when:
- ✅ API Test Panel shows all services
- ✅ Pollen forecasts display with realistic data
- ✅ Camera captures and stores photos
- ✅ Maps show your location and submissions
- ✅ Symptom logging saves and displays trends
- ✅ App works offline (try airplane mode)

## 🆘 Need Help?

1. **Check API Test Panel** in Settings
2. **View browser console** for errors (F12)
3. **Review this guide** for common solutions
4. **Check documentation** in `/docs` folder

The app is designed to work great with mock data, so you can start testing immediately!
