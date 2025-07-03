# 🌻 CrowdPollen - Community Pollen Tracking App

A Progressive Web App (PWA) that enables communities to track and share local pollen levels through crowd-sourced data collection using smartphone cameras and simple pollen traps.

## 🚀 Features

### Core Functionality
- **📱 Mobile-First Design**: Optimized for smartphones with responsive design
- **📷 Camera Integration**: Capture photos of pollen traps with guided interface
- **🗺️ Interactive Maps**: View local and nationwide pollen levels
- **📊 Real-time Data**: Community-driven pollen level tracking
- **📍 Location Services**: GPS and ZIP code location input
- **💾 Offline Support**: Works without internet connection
- **🔔 Smart Notifications**: Pollen alerts and reminders

### User Experience
- **🎯 Onboarding Flow**: Guided setup for new users
- **👤 User Profiles**: Personalized allergen tracking
- **📈 Symptom Logging**: Track symptoms alongside pollen data
- **📱 PWA Features**: Install as native app, offline caching
- **🌙 Accessibility**: Screen reader support, high contrast options

### Technical Features
- **⚡ Fast Performance**: Optimized loading and caching
- **🔒 Privacy-First**: Anonymous submissions by default
- **📊 Analytics**: Usage tracking and performance monitoring
- **🛠️ Error Handling**: Comprehensive error boundaries
- **🔄 Real-time Updates**: Live data synchronization

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework with hooks and context
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Modern icon library
- **React Router** - Client-side routing

### Backend & Services
- **Supabase** - Database, authentication, and storage
- **PostgreSQL** - Relational database with PostGIS
- **Supabase Storage** - Image hosting and CDN
- **Row Level Security** - Data protection

### APIs & Integrations
- **Mapbox** - Maps and geocoding services
- **Replicate** - ML model hosting (planned)
- **OpenWeatherMap** - Weather data (planned)
- **Web APIs** - Camera, Geolocation, Notifications

### Deployment
- **Vercel** - Hosting and CI/CD
- **Service Worker** - Offline functionality
- **PWA Manifest** - App installation

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Modern web browser
- Supabase account (free tier)
- Mapbox account (free tier)

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended) 🛠️

```bash
# 1. Clone and install
git clone <repository-url>
cd crowdpollen
npm install

# 2. Use the setup tool
open setup/index.html
# Follow guided setup to configure APIs and generate .env file
```

### Option 2: Manual Setup

```bash
# 1. Clone and install
git clone <repository-url>
cd crowdpollen
npm install

# 2. Manual environment setup
cp .env.example .env
# Edit .env with your API keys
```

### API Configuration

The setup tool (`setup/index.html`) helps configure:
- **🗄️ Supabase** - Database and storage
- **🗺️ Mapbox** - Maps and geocoding  
- **🤗 Hugging Face** - ML pollen detection
- **🌤️ OpenWeatherMap** - Weather data

### 3. Database Setup

1. Create a new Supabase project
2. Run the SQL schema from `docs/database-schema.sql`
3. Set up storage bucket named "pollen-images"
4. Configure Row Level Security policies

### 4. Development

```bash
npm run dev
```

Visit `http://localhost:3000` to see the app.

### 5. Production Build

```bash
npm run build
npm run preview
```

## 📱 Mobile Testing

### Local HTTPS Testing

For camera and GPS testing on mobile devices:

```bash
# Install SSL plugin
npm install -D @vitejs/plugin-basic-ssl

# Start with HTTPS
npm run dev
```

Access via `https://your-local-ip:3000` on mobile devices.

### Device Testing Checklist

- [ ] Camera access on iOS Safari
- [ ] Camera access on Android Chrome  
- [ ] GPS location permission
- [ ] Photo capture and upload
- [ ] Offline functionality
- [ ] PWA installation

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Camera.jsx      # Camera interface with guides
│   ├── LocationInput.jsx # GPS/ZIP location input
│   ├── Navigation.jsx   # Bottom navigation
│   ├── LoadingScreen.jsx # Loading states
│   └── ErrorBoundary.jsx # Error handling
├── screens/            # Main app screens
│   ├── HomeScreen.jsx  # Dashboard and overview
│   ├── CameraScreen.jsx # Photo capture flow
│   ├── MapScreen.jsx   # Interactive map view
│   ├── SymptomLogScreen.jsx # Symptom tracking
│   ├── HistoryScreen.jsx # User submission history
│   ├── SettingsScreen.jsx # App preferences
│   └── OnboardingScreen.jsx # First-time setup
├── contexts/           # React context providers
│   ├── AuthContext.jsx # User authentication
│   ├── LocationContext.jsx # Location services
│   └── NotificationContext.jsx # Push notifications
├── services/           # API and external services
│   └── crowdPollenAPI.js # Backend API calls
├── lib/               # Utilities and configuration
│   └── supabase.js    # Supabase client setup
└── App.jsx           # Main app component
```

## 🔧 Configuration

### Supabase Setup

1. **Database Schema**: Import from `docs/database-schema.sql`
2. **Storage**: Create "pollen-images" bucket (public)
3. **RLS Policies**: Enable row-level security
4. **API Keys**: Get project URL and anon key

### Mapbox Setup

1. Create account at mapbox.com
2. Generate access token
3. Add to environment variables
4. Configure map styles (optional)

### PWA Configuration

The app includes:
- Service worker for offline caching
- Web app manifest for installation
- Icon sets for different devices
- Splash screen configuration

## 📊 Database Schema

### Core Tables

- **user_profiles** - User settings and preferences
- **submissions** - Pollen readings and photos
- **locations** - Aggregated location data
- **notifications** - Push notification queue

### Key Features

- PostGIS for geospatial queries
- Automatic timestamps and triggers
- Row-level security policies
- Optimized indexes for performance

## 🔒 Privacy & Security

### Data Protection
- Anonymous submissions by default
- Optional user identification
- GDPR-compliant data handling
- Secure image storage

### Security Measures
- Row Level Security (RLS)
- API key protection
- Input validation and sanitization
- Rate limiting on submissions

## 🚀 Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Redeploy with production settings
vercel --prod
```

### Environment Variables

Set these in your deployment platform:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` 
- `VITE_MAPBOX_TOKEN`

## 🧪 Testing

### Manual Testing

1. **Camera Functionality**
   - Photo capture on different devices
   - Image upload and processing
   - Error handling for camera access

2. **Location Services**
   - GPS permission and accuracy
   - ZIP code geocoding
   - Map display and interaction

3. **Offline Functionality**
   - Service worker caching
   - Offline page display
   - Data sync when online

### Performance Testing

- Lighthouse audit (aim for 90+ score)
- Core Web Vitals monitoring
- Image optimization verification
- Bundle size analysis

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request
5. Code review and merge

### Code Standards

- ESLint configuration included
- Prettier for code formatting
- Component documentation
- Accessibility compliance

## 📈 Analytics & Monitoring

### Included Tracking

- User journey analytics
- Performance monitoring
- Error tracking and reporting
- Feature usage statistics

### Privacy-Compliant

- No personal data collection
- Anonymized usage patterns
- Opt-out capabilities
- GDPR compliance

## 🌟 Google Pollen API Integration

### ✅ **IMPLEMENTATION COMPLETE - Phase 1 & 2**

CrowdPollen has been successfully transformed into a hybrid platform that combines Google's professional-grade forecast data with real-time user submissions, providing unprecedented accuracy and coverage.

**📖 Documentation:**
- **[Complete Integration Plan](docs/google-pollen-integration-plan.md)** - Detailed technical architecture and implementation strategy
- **[Implementation Roadmap](docs/implementation-roadmap.md)** - Day-by-day development timeline and milestones
- **[Implementation Summary](docs/google-pollen-implementation-summary.md)** - ✨ **NEW**: Complete overview of implemented features

### 🎯 **Key Benefits of Integration**

**For Users:**
- 5-day professional pollen forecasts
- Validation of user submissions against authoritative data
- Enhanced educational content with detailed plant information
- Smart notifications based on forecast + real-time data

**For the Platform:**
- Dual-layer map experience (forecast heatmaps + user markers)
- Improved prediction accuracy through data fusion
- Professional credibility with Google's authoritative data
- Reduced dependency on user density for coverage

### 🚀 **Implementation Timeline**

- **Week 1-2**: Foundation setup (Google Cloud, API integration, database schema)
- **Week 3-4**: Core features (forecast display, map heatmaps, validation system)
- **Week 5-6**: Enhanced UX (advanced controls, plant info, notifications)
- **Week 7-8**: Advanced features (research dashboard, gamification, analytics)

### 💰 **Cost Estimates**

- **1,000 users**: ~$17/month
- **10,000 users**: ~$170/month  
- **100,000 users**: ~$1,700/month

*Includes smart caching and optimization strategies to minimize API costs.*

---

## 🔮 Future Enhancements

### Planned Features

- **🌍 Google Pollen API**: Professional 5-day forecasts and validation (see integration plan above)
- **🤖 ML Integration**: Real-time pollen analysis with computer vision
- **🌡️ Weather Integration**: Correlation with weather data and conditions
- **📱 Push Notifications**: Pollen alerts and reminders
- **👥 Community Features**: User profiles and social sharing
- **📊 Advanced Analytics**: Trend analysis and predictions
- **🏥 Health Integration**: Symptom correlation and insights

### Technical Improvements

- **⚡ Performance**: Further optimization and caching
- **🔒 Security**: Enhanced authentication and encryption
- **📱 Native Apps**: iOS and Android native versions
- **🌐 Internationalization**: Multi-language support
- **♿ Accessibility**: Enhanced screen reader support

## 📞 Support

### Getting Help

- Check the [Issues](../../issues) page for known problems
- Review the [Documentation](./docs/) for detailed guides
- Contact the development team for technical support

### Reporting Issues

When reporting bugs, please include:
- Device and browser information
- Steps to reproduce the issue
- Screenshots or error messages
- Expected vs actual behavior

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** - Backend infrastructure and database
- **Mapbox** - Mapping and geocoding services
- **Vercel** - Hosting and deployment platform
- **React Community** - Framework and ecosystem
- **Open Source Contributors** - Various libraries and tools

---

**Built with ❤️ for healthier communities**

*CrowdPollen helps people understand and manage their local pollen environment through community-driven data collection and sharing.*
