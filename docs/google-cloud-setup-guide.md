# 🌐 Google Cloud Setup Guide

## Google Cloud APIs for CrowdPollen

### 🎯 **Required APIs (Must Enable)**
```
✅ Maps JavaScript API - Display interactive maps
✅ Geocoding API - Convert addresses to coordinates  
✅ Pollen API - Professional pollen forecasts (core feature)
```

### 🔧 **Recommended APIs (Enhanced Features)**
```
✅ Places API (New) - Location search and autocomplete
✅ Geolocation API - Location without GPS permission ($5/1,000 requests)
✅ Air Quality API - Enhanced environmental data
```

### 🌤️ **Optional APIs (Limited Availability)**
```
⚠️ Weather API - Currently in limited preview, may not be available
```

**Note**: CrowdPollen includes robust mock data for weather, so the app works perfectly even without Google's Weather API. The weather service automatically falls back to realistic mock data when the API is unavailable.

## 📋 Step-by-Step Setup

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Create Project"** or select existing project
3. Note your **Project ID**

### 2. Enable Required APIs
Go to **APIs & Services → Library** and search for each API:

#### **Maps JavaScript API**
- **Purpose**: Display interactive maps
- **Usage**: Map tiles, user interface, markers
- **Required**: Yes

#### **Geocoding API** 
- **Purpose**: Convert addresses to coordinates
- **Usage**: Location input, address lookup
- **Required**: Yes

#### **Places API (New)**
- **Purpose**: Location search and details
- **Usage**: Address autocomplete, place details
- **Required**: Yes

#### **Geolocation API**
- **Purpose**: Get location from IP/WiFi/cell towers
- **Usage**: Fallback when GPS unavailable
- **Required**: Recommended

#### **Pollen API**
- **Purpose**: Professional pollen forecasts
- **Usage**: 5-day pollen forecasts, heatmaps
- **Required**: Yes (core feature)

#### **Air Quality API**
- **Purpose**: Air quality data
- **Usage**: Enhanced environmental data
- **Required**: Optional but recommended

### 3. Create API Key
1. Go to **APIs & Services → Credentials**
2. Click **"+ CREATE CREDENTIALS"**
3. Select **"API key"**
4. Copy the generated key

### 4. Secure Your API Key (Important!)
1. Click **"RESTRICT KEY"** on your new API key
2. Under **"API restrictions"**, select **"Restrict key"**
3. Choose these APIs:
   - Maps JavaScript API
   - Geocoding API
   - Places API (New)
   - Geolocation API
   - Pollen API
   - Air Quality API (if enabled)

### 5. Set Up Billing
⚠️ **Important**: Google Cloud requires billing to be enabled for most APIs

1. Go to **Billing** in Google Cloud Console
2. Link a payment method
3. Set up **budget alerts** to monitor costs

## 💰 Cost Estimates

### **Free Tier Limits**
- **Maps JavaScript API**: $200 free credit monthly
- **Geocoding API**: $200 free credit monthly  
- **Places API**: $200 free credit monthly
- **Pollen API**: No free tier - $0.50 per 1,000 requests

### **Typical Monthly Costs for CrowdPollen**
```
📱 Small app (100 users):
- Maps: ~$10-20/month
- Geocoding: ~$5-10/month  
- Pollen: ~$15-30/month
- Total: ~$30-60/month

🏢 Medium app (1,000 users):
- Maps: ~$50-100/month
- Geocoding: ~$20-40/month
- Pollen: ~$100-200/month  
- Total: ~$170-340/month
```

## 🔧 Environment Configuration

Add your API key to `.env`:
```env
# Google Cloud - Single API key for all services
VITE_GOOGLE_MAPS_API_KEY=your_google_cloud_api_key
```

## 🧪 Testing Your Setup

Use the API Test Panel in CrowdPollen:
1. **Settings → Developer Tools → API Test Panel**
2. **Click "🧪 Test All APIs"**
3. **Verify all services show ✅ Green status**

## 🚨 Common Issues & Solutions

### **"API key not valid" Error**
- ✅ Check API key is copied correctly
- ✅ Ensure billing is enabled
- ✅ Verify APIs are enabled in console
- ✅ Check API restrictions match enabled APIs

### **"Quota exceeded" Error**  
- ✅ Check usage in Google Cloud Console
- ✅ Increase quotas if needed
- ✅ Set up billing alerts
- ✅ Implement caching (already built into CrowdPollen)

### **"This API is not enabled" Error**
- ✅ Go to APIs & Services → Library
- ✅ Search for the specific API
- ✅ Click "Enable"

### **Maps not loading**
- ✅ Check browser console for errors
- ✅ Verify Maps JavaScript API is enabled
- ✅ Check API key restrictions

## 🌍 Alternative: Geolocation API vs Browser GPS

### **Browser GPS (Current)**
- ✅ Free
- ✅ More accurate
- ❌ Requires user permission
- ❌ May not work indoors

### **Google Geolocation API (Optional)**
- ✅ Works without user permission
- ✅ Works indoors (WiFi/cell towers)
- ❌ Costs money ($5 per 1,000 requests)
- ❌ Less accurate than GPS

**Recommendation**: Start with browser GPS, add Geolocation API later if needed.

## 📊 Monitoring Usage

### **Set Up Alerts**
1. Go to **Monitoring → Alerting**
2. Create alerts for:
   - API usage approaching limits
   - Unexpected cost increases
   - Error rate spikes

### **View Usage**
- **APIs & Services → Dashboard**: See API usage
- **Billing → Reports**: See cost breakdown
- **Monitoring → Metrics Explorer**: Detailed metrics

## 🔒 Security Best Practices

### **API Key Security**
- ✅ Restrict API key to specific APIs
- ✅ Add HTTP referrer restrictions for web apps
- ✅ Never commit API keys to version control
- ✅ Rotate keys regularly

### **Domain Restrictions**
For production, add your domain:
1. **Credentials → Edit API Key**
2. **Application restrictions → HTTP referrers**
3. Add: `https://yourdomain.com/*`

## 🚀 Production Checklist

Before going live:
- [ ] All required APIs enabled
- [ ] API key properly restricted
- [ ] Billing account set up
- [ ] Budget alerts configured
- [ ] Domain restrictions added
- [ ] Usage monitoring enabled
- [ ] Error handling tested
- [ ] Caching verified working

## 🆘 Need Help?

1. **Check API Test Panel** for specific errors
2. **Google Cloud Console → Support** for billing/API issues
3. **CrowdPollen docs** for app-specific problems
4. **Browser console** for JavaScript errors

The Google Cloud setup is the most complex part, but once configured, it provides reliable, professional-grade data for your pollen tracking app!
