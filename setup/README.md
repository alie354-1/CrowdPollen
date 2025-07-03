# 🌻 CrowdPollen API Setup Tool

This standalone setup tool helps developers configure all the required APIs and services for CrowdPollen development.

## 🚀 Quick Start

1. **Open the setup tool:**
   ```bash
   # Option 1: Open directly in browser
   open setup/index.html
   
   # Option 2: Serve via development server
   cd setup
   python -m http.server 8080
   # Then visit http://localhost:8080
   ```

2. **Configure APIs step by step:**
   - Fill in your API credentials
   - Test each service connection
   - Run database migration
   - Generate .env file

3. **Copy .env to project root:**
   ```bash
   # Download the generated .env file and move it
   mv ~/Downloads/.env .env
   ```

## 📋 Required API Keys

### 🗄️ Supabase
1. Go to [app.supabase.com](https://app.supabase.com)
2. Create a new project
3. Go to Settings → API
4. Copy:
   - **Project URL**: `https://your-project.supabase.co`
   - **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (for migrations)

### 🗺️ Mapbox
1. Go to [mapbox.com](https://www.mapbox.com)
2. Create account and go to Account → Access Tokens
3. Copy your **Default Public Token**: `pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNsZjJ...`

### 🤗 Hugging Face
1. Go to [huggingface.co](https://huggingface.co)
2. Create account and go to Settings → Access Tokens
3. Create a new token with **Read** permissions
4. Copy your **API Token**: `hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
5. Enter your **Model ID**: `your-username/pollen-detection-model`

### 🌤️ OpenWeatherMap
1. Go to [openweathermap.org](https://openweathermap.org/api)
2. Sign up for free account
3. Go to API Keys section
4. Copy your **API Key**: `your_openweathermap_api_key`

## 🔧 Setup Process

### Step 1: Configure APIs
- Enter all API credentials in the setup tool
- Test each connection to verify they work
- Green indicators show successful connections

### Step 2: Run Database Migration
- Ensure Supabase is configured and tested
- Click "Run Migration" to create database schema
- Watch progress bar for completion status

### Step 3: Generate Environment File
- Click "Generate .env File" when all tests pass
- Preview the generated configuration
- Download or copy to clipboard

### Step 4: Start Development
```bash
# Copy .env to project root
cp ~/Downloads/.env .env

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🧪 Testing Features

The setup tool includes comprehensive testing:

- **Supabase**: Tests database connection and storage access
- **Mapbox**: Tests geocoding with sample location
- **Hugging Face**: Tests model accessibility and inference
- **OpenWeatherMap**: Tests weather API with sample query
- **Database Migration**: Runs complete schema setup with progress tracking

## 🔍 Troubleshooting

### Common Issues

**Supabase Connection Failed**
- Verify Project URL format: `https://your-project.supabase.co`
- Check that Anon Key is copied correctly
- Ensure project is not paused

**Mapbox Geocoding Failed**
- Verify token starts with `pk.`
- Check token permissions include geocoding
- Ensure token is not restricted by URL

**Hugging Face Model Not Accessible**
- Verify token starts with `hf_`
- Check model ID format: `username/model-name`
- Ensure model is public or you have access

**Weather API Failed**
- Verify API key is active
- Check you haven't exceeded free tier limits
- Ensure key has current weather permissions

**Database Migration Issues**
- Use Service Role Key (not Anon Key) for migrations
- Some migration warnings are normal
- Check Supabase logs for detailed errors

### Getting Help

1. Check the setup tool logs for detailed error messages
2. Verify all API keys are active and have correct permissions
3. Ensure you're using the correct key types (anon vs service role)
4. Check API provider documentation for specific requirements

## 📁 Generated Files

The setup tool generates a complete `.env` file with:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_configured_url
VITE_SUPABASE_ANON_KEY=your_configured_key

# Mapbox Configuration  
VITE_MAPBOX_ACCESS_TOKEN=your_configured_token

# Hugging Face Configuration
VITE_HUGGINGFACE_API_TOKEN=your_configured_token
VITE_HUGGINGFACE_MODEL_ID=your_configured_model
VITE_HUGGINGFACE_ENDPOINT=your_configured_endpoint

# OpenWeatherMap Configuration
VITE_OPENWEATHER_API_KEY=your_configured_key

# Application Configuration
VITE_APP_ENV=development
VITE_APP_VERSION=1.0.0
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PUSH_NOTIFICATIONS=false
VITE_ENABLE_OFFLINE_MODE=true

# Debug Configuration
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=info
```

## 🎯 Next Steps

After setup is complete:

1. **Start Development**: `npm run dev`
2. **Test Camera**: Verify camera access works
3. **Test Location**: Check GPS and geocoding
4. **Test Uploads**: Verify image upload to Supabase
5. **Test ML**: Confirm Hugging Face model integration

## 🔒 Security Notes

- Never commit `.env` files to version control
- Keep API keys secure and rotate them regularly
- Use environment-specific keys for development vs production
- The Service Role Key has admin access - handle with care

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review API provider documentation
3. Check Supabase project logs
4. Verify all prerequisites are met

Happy coding! 🌻
