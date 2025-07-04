# CrowdPollen Admin Access Guide

## 🔗 Admin URL

**Direct Access:** `/api-settings`

### Local Development
```
http://localhost:5173/api-settings
```

### Production
```
https://yourdomain.com/api-settings
```

## 📱 Access Methods

### 1. Direct URL
Navigate directly to the `/api-settings` URL in your browser.

### 2. Through Settings Menu
1. Open the app
2. Go to Settings (gear icon in navigation)
3. Scroll down to "Admin" section
4. Click "API Settings"

## 🎛️ Admin Features Available

### API Testing Tab
- **Google Pollen API**: Test forecast retrieval
- **Google Maps API**: Test geocoding and reverse geocoding
- **Google Geolocation API**: Test location services
- **Mock Data Testing**: Test without API calls
- **Performance Analysis**: Response time monitoring

### API Monitoring Tab
- **Real-time Usage**: Live API call statistics
- **Cost Tracking**: Detailed cost analysis and projections
- **Performance Metrics**: Response times and success rates
- **Historical Data**: 30-day usage trends
- **Usage Alerts**: Warnings for high usage

### Admin Controls
- **Google Geolocation Toggle**: Enable/disable paid location services
- **Rate Limiting**: Built-in cost protection settings
- **Service Status**: Real-time API health monitoring

## 💰 Cost Protection Features

### Automatic Safeguards
- **Rate Limiting**: 10 requests/hour for Geolocation API
- **Time Throttling**: 5-minute minimum between calls
- **Distance Filtering**: Only updates when moved 100+ meters
- **Smart Caching**: Reuses recent data to minimize API calls
- **Fallback Logic**: Uses free GPS when rate limited

### Cost Estimates
- **Google Pollen API**: $1 per 1,000 requests
- **Google Geolocation**: $5 per 1,000 requests  
- **Google Geocoding**: $5 per 1,000 requests
- **Expected Monthly**: $10-50 for typical usage

## 🔧 Anonymous Mode Features

### User Data Management
- **Clear All Data Button**: Available in Settings > Danger Zone
- **Export Data**: Download all user data as JSON
- **No Account Required**: Full functionality without signup
- **Local Storage**: All data stored locally on device

### What Gets Cleared
- User submissions and photos
- Symptom logs and history
- Location preferences
- Notification settings
- API usage statistics

## 🚀 Quick Start Checklist

1. **Configure Environment**
   ```bash
   VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

2. **Access Admin Panel**
   - Navigate to `/api-settings`
   - Or use Settings > Admin > API Settings

3. **Test APIs**
   - Use API Testing tab to validate all services
   - Check response times and success rates

4. **Monitor Usage**
   - Switch to API Monitoring tab
   - Review cost projections and usage patterns

5. **Configure Services**
   - Enable/disable Google Geolocation as needed
   - Review rate limiting settings

## 📊 Monitoring Dashboard

### Key Metrics
- **Total API Calls**: Real-time counter
- **Success Rate**: Percentage of successful requests
- **Average Response Time**: Performance indicator
- **Daily Cost**: Current day's API costs
- **Monthly Projection**: Estimated monthly costs

### Usage Trends
- **24-Hour Activity**: Hourly API call distribution
- **7-Day History**: Weekly usage patterns
- **30-Day Overview**: Monthly trends and costs

## 🛡️ Security Notes

- Admin panel is client-side only
- No server-side authentication required
- API keys stored in environment variables
- All data processing happens locally
- No sensitive data transmitted to external servers

## 📞 Support

For technical issues or questions:
- **Email**: support@crowdpollen.com
- **Documentation**: Available in `/docs` folder
- **Testing Guide**: See `docs/quick-testing-guide.md`
