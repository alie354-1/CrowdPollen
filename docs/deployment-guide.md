# CrowdPollen Deployment Guide

## Overview

This guide covers deploying CrowdPollen with the complete Google Pollen API integration. The application now includes both community-driven data collection and professional-grade forecasting capabilities.

## Prerequisites

### Required Accounts & API Keys

1. **Supabase Account** (Free tier available)
   - Project URL and anon key
   - Database with PostGIS extension
   - Storage bucket for images

2. **Mapbox Account** (Free tier: 50,000 requests/month)
   - Access token for maps and geocoding

3. **Google Cloud Platform Account**
   - Google Pollen API key
   - Billing account (required for API access)

### Optional Services

4. **Hugging Face Account** (For ML features)
   - API token for pollen detection models

5. **OpenWeatherMap Account** (For weather integration)
   - API key for weather data

## Environment Configuration

### 1. Copy Environment Template

```bash
cp .env.example .env
```

### 2. Configure Required Variables

```bash
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Mapbox Configuration (REQUIRED)
VITE_MAPBOX_ACCESS_TOKEN=pk.your_mapbox_token

# Google Pollen API Configuration (REQUIRED for forecasts)
VITE_GOOGLE_POLLEN_API_KEY=your_google_pollen_api_key
```

### 3. Configure Optional Variables

```bash
# Hugging Face Configuration (OPTIONAL)
VITE_HUGGINGFACE_API_TOKEN=your_huggingface_token
VITE_HUGGINGFACE_MODEL_ID=your_username/pollen-detection-model

# OpenWeatherMap Configuration (OPTIONAL)
VITE_OPENWEATHER_API_KEY=your_openweather_key

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PUSH_NOTIFICATIONS=false
VITE_ENABLE_OFFLINE_MODE=true
```

## Database Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Wait for database initialization
4. Note your project URL and anon key

### 2. Run Database Schema

1. Open Supabase SQL Editor
2. Copy contents of `docs/database-schema.sql`
3. Execute the SQL script
4. Verify tables are created successfully

### 3. Configure Storage

1. Go to Storage in Supabase dashboard
2. Create bucket named `pollen-images`
3. Set bucket to public
4. Configure RLS policies (included in schema)

### 4. Enable PostGIS Extension

```sql
-- Run in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS "postgis";
```

## Google Cloud Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable billing (required for Pollen API)

### 2. Enable Pollen API

1. Go to APIs & Services > Library
2. Search for "Pollen API"
3. Click "Enable"

### 3. Create API Key

1. Go to APIs & Services > Credentials
2. Click "Create Credentials" > "API Key"
3. Copy the API key
4. Optionally restrict key to Pollen API only

### 4. Test API Access

```bash
# Test API key (replace YOUR_API_KEY)
curl "https://pollen.googleapis.com/v1/forecast:lookup?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "location": {
      "latitude": 37.7749,
      "longitude": -122.4194
    },
    "days": 1
  }'
```

## Local Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Test Core Features

- [ ] Location services working
- [ ] Camera functionality
- [ ] Map display with layers
- [ ] Forecast widget loading
- [ ] User submissions
- [ ] Google Pollen integration

### 4. HTTPS Testing (for mobile)

```bash
# Install SSL plugin
npm install -D @vitejs/plugin-basic-ssl

# Start with HTTPS
npm run dev -- --https
```

## Production Deployment

### Option 1: Vercel (Recommended)

#### 1. Install Vercel CLI

```bash
npm i -g vercel
```

#### 2. Deploy

```bash
# Initial deployment
vercel

# Follow prompts to link project
# Set environment variables in dashboard
```

#### 3. Configure Environment Variables

In Vercel dashboard:
1. Go to Project Settings > Environment Variables
2. Add all variables from your `.env` file
3. Redeploy: `vercel --prod`

#### 4. Custom Domain (Optional)

1. Go to Project Settings > Domains
2. Add your custom domain
3. Configure DNS records as instructed

### Option 2: Netlify

#### 1. Build Project

```bash
npm run build
```

#### 2. Deploy

1. Drag `dist` folder to Netlify
2. Or connect Git repository
3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`

#### 3. Environment Variables

1. Go to Site Settings > Environment Variables
2. Add all required variables
3. Redeploy site

### Option 3: Self-Hosted

#### 1. Build Project

```bash
npm run build
```

#### 2. Serve Static Files

```bash
# Using serve
npm install -g serve
serve -s dist -l 3000

# Using nginx
# Copy dist/ contents to nginx web root
# Configure nginx for SPA routing
```

## Post-Deployment Checklist

### 1. Functionality Testing

- [ ] App loads without errors
- [ ] Location services work
- [ ] Camera captures photos
- [ ] Photos upload to Supabase
- [ ] Maps display correctly
- [ ] Google Pollen forecasts load
- [ ] User submissions save
- [ ] Validation system works
- [ ] PWA installation works

### 2. Performance Testing

- [ ] Lighthouse score > 90
- [ ] Core Web Vitals pass
- [ ] Images load quickly
- [ ] API responses < 2s
- [ ] Offline mode works

### 3. Mobile Testing

- [ ] iOS Safari compatibility
- [ ] Android Chrome compatibility
- [ ] Touch interactions work
- [ ] Camera permissions
- [ ] GPS permissions
- [ ] PWA installation

### 4. API Monitoring

- [ ] Google Pollen API usage tracking
- [ ] Supabase usage monitoring
- [ ] Mapbox request tracking
- [ ] Error rate monitoring

## Monitoring & Maintenance

### 1. API Usage Monitoring

#### Google Pollen API
- Monitor daily/monthly usage
- Set up billing alerts
- Track cache hit rates
- Monitor error rates

#### Supabase
- Database storage usage
- Bandwidth consumption
- Function invocations
- Storage usage

#### Mapbox
- Monthly request count
- Map loads and geocoding
- Tile requests

### 2. Performance Monitoring

```javascript
// Add to your analytics
const performanceMetrics = {
  apiResponseTime: 'Track API call duration',
  cacheHitRate: 'Monitor cache effectiveness',
  errorRate: 'Track application errors',
  userEngagement: 'Monitor feature usage'
};
```

### 3. Regular Maintenance

#### Weekly
- [ ] Check error logs
- [ ] Monitor API usage
- [ ] Review user feedback

#### Monthly
- [ ] Update dependencies
- [ ] Review performance metrics
- [ ] Optimize database queries
- [ ] Clean up old cache data

#### Quarterly
- [ ] Security audit
- [ ] Performance optimization
- [ ] Feature usage analysis
- [ ] Cost optimization review

## Troubleshooting

### Common Issues

#### 1. Google Pollen API Errors

**403 Forbidden**
- Check API key is correct
- Verify billing is enabled
- Ensure Pollen API is enabled

**429 Rate Limited**
- Implement request throttling
- Increase cache duration
- Review usage patterns

#### 2. Supabase Connection Issues

**CORS Errors**
- Check project URL is correct
- Verify anon key permissions
- Review RLS policies

**Storage Upload Failures**
- Check bucket permissions
- Verify file size limits
- Review storage policies

#### 3. Map Display Issues

**Blank Map**
- Verify Mapbox token
- Check network connectivity
- Review browser console

**Missing Layers**
- Check Google API key
- Verify layer visibility settings
- Review network requests

### Debug Mode

Enable debug logging:

```javascript
// Add to .env
VITE_DEBUG_MODE=true

// Check browser console for detailed logs
```

## Security Considerations

### 1. API Key Security

- Never commit API keys to version control
- Use environment variables only
- Rotate keys regularly
- Restrict API key permissions

### 2. Database Security

- Enable RLS on all tables
- Review and test policies
- Monitor access logs
- Regular security audits

### 3. User Data Protection

- Anonymous submissions by default
- GDPR compliance measures
- Data retention policies
- Secure image storage

## Cost Optimization

### 1. Google Pollen API

- Implement smart caching (6-hour duration)
- Round coordinates to reduce cache fragmentation
- Batch requests when possible
- Monitor usage patterns

### 2. Supabase

- Optimize database queries
- Use appropriate indexes
- Implement data archiving
- Monitor storage usage

### 3. Mapbox

- Cache map tiles
- Optimize zoom levels
- Use appropriate map styles
- Monitor request patterns

## Support

### Getting Help

1. **Documentation**: Check all docs in `/docs` folder
2. **Issues**: Create GitHub issue with details
3. **Community**: Join discussions
4. **Support**: Contact development team

### Reporting Issues

Include in bug reports:
- Environment details
- Steps to reproduce
- Error messages/logs
- Expected vs actual behavior
- Browser/device information

---

## Conclusion

CrowdPollen is now ready for production deployment with full Google Pollen API integration. The hybrid platform provides users with both professional forecasting and community-driven insights, creating a comprehensive pollen monitoring solution.

**Key Features Deployed:**
- ✅ 5-day professional forecasts
- ✅ Real-time user submissions
- ✅ Data validation and fusion
- ✅ Enhanced map visualizations
- ✅ Mobile-optimized PWA
- ✅ Offline functionality
- ✅ Cost-optimized API usage

The platform is positioned to serve communities worldwide with accurate, timely pollen information that helps people manage their allergies and outdoor activities effectively.
