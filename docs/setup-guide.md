# 🚀 CrowdPollen Setup Guide

This guide will walk you through setting up the CrowdPollen application from scratch.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)
- **Modern web browser** (Chrome, Firefox, Safari, Edge)
- **Code editor** (VS Code recommended)

## 🔧 Required Accounts

You'll need free accounts for these services:

1. **Supabase** - [supabase.com](https://supabase.com) (Database & Storage)
2. **Mapbox** - [mapbox.com](https://mapbox.com) (Maps & Geocoding)
3. **Vercel** - [vercel.com](https://vercel.com) (Deployment - Optional)

## 🏗️ Step 1: Project Setup

### Clone and Install

```bash
# Clone the repository
git clone <your-repository-url>
cd crowdpollen

# Install dependencies
npm install
```

### Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Mapbox Configuration
VITE_MAPBOX_TOKEN=your_mapbox_access_token

# Optional: For future ML integration
VITE_REPLICATE_API_TOKEN=your_replicate_token
```

## 🗄️ Step 2: Supabase Database Setup

### Create Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New project"
3. Choose your organization
4. Enter project details:
   - **Name**: `crowdpollen`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for setup to complete (2-3 minutes)

### Get API Keys

1. In your Supabase dashboard, go to **Settings → API**
2. Copy these values to your `.env.local`:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

### Run Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Copy the entire contents of `docs/database-schema.sql`
3. Paste into the SQL editor
4. Click "Run" to execute
5. Verify tables were created in **Table Editor**

### Set Up Storage

1. Go to **Storage** in Supabase dashboard
2. Click "Create a new bucket"
3. Enter details:
   - **Name**: `pollen-images`
   - **Public bucket**: ✅ Enabled
   - **File size limit**: 5MB
   - **Allowed MIME types**: `image/jpeg,image/png,image/webp`
4. Click "Create bucket"

### Configure Storage Policies

In the SQL Editor, run these commands:

```sql
-- Allow public read access to images
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'pollen-images');

-- Allow anyone to upload images
CREATE POLICY "Anyone can upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'pollen-images');
```

## 🗺️ Step 3: Mapbox Setup

### Create Mapbox Account

1. Go to [mapbox.com](https://mapbox.com)
2. Sign up for a free account
3. Verify your email address

### Get Access Token

1. Go to your [Mapbox Account page](https://account.mapbox.com/)
2. In the "Access tokens" section, copy the **Default public token**
3. Add it to your `.env.local` as `VITE_MAPBOX_TOKEN`

### Optional: Create Custom Token

For production, create a custom token with limited scopes:

1. Click "Create a token"
2. Enter name: `CrowdPollen Production`
3. Select scopes:
   - ✅ Maps:Read
   - ✅ Geocoding:Read
   - ✅ Navigation:Read
4. Add URL restrictions (your domain)
5. Click "Create token"

## 🚀 Step 4: Development

### Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Verify Setup

Check that these features work:

1. **App loads** - No console errors
2. **Navigation** - Bottom tabs switch screens
3. **Location input** - ZIP code geocoding works
4. **Camera access** - Browser requests permission
5. **Database connection** - No Supabase errors in console

## 📱 Step 5: Mobile Testing

### Enable HTTPS for Local Testing

Mobile devices require HTTPS for camera access:

```bash
# Install SSL plugin
npm install -D @vitejs/plugin-basic-ssl

# Update vite.config.js to include:
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    https: true,
    host: true
  }
})

# Restart dev server
npm run dev
```

### Test on Mobile Device

1. Note your computer's IP address (e.g., `192.168.1.100`)
2. On mobile device (same WiFi network):
   - Open browser
   - Go to `https://192.168.1.100:3000`
   - Accept security warning
   - Test camera and GPS features

## 🔧 Step 6: Production Build

### Build for Production

```bash
# Create production build
npm run build

# Preview production build locally
npm run preview
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts:
# - Link to existing project: No
# - Project name: crowdpollen
# - Directory: ./
# - Override settings: No
```

### Set Environment Variables in Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings → Environment Variables**
4. Add all variables from your `.env.local`
5. Redeploy: `vercel --prod`

## 🧪 Step 7: Testing

### Manual Testing Checklist

- [ ] **Home Screen**: Displays pollen level and quick actions
- [ ] **Camera**: Opens camera, captures photos, uploads to Supabase
- [ ] **Location**: GPS permission works, ZIP code geocoding works
- [ ] **Map**: Displays correctly, shows sample data points
- [ ] **Symptom Log**: Form submits successfully
- [ ] **History**: Shows user submissions (when logged in)
- [ ] **Settings**: Preferences save correctly
- [ ] **Offline**: Works without internet connection

### Performance Testing

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run Lighthouse audit
lighthouse http://localhost:3000 --view

# Target scores:
# Performance: 90+
# Accessibility: 90+
# Best Practices: 90+
# SEO: 90+
```

## 🐛 Troubleshooting

### Common Issues

**Camera not working on mobile:**
- Ensure you're using HTTPS
- Check browser permissions
- Try different browsers (Safari on iOS, Chrome on Android)

**Supabase connection errors:**
- Verify API keys in `.env.local`
- Check network connectivity
- Ensure RLS policies are set correctly

**Map not displaying:**
- Verify Mapbox token is correct
- Check browser console for errors
- Ensure token has correct permissions

**Build errors:**
- Clear node_modules: `rm -rf node_modules && npm install`
- Update dependencies: `npm update`
- Check for TypeScript errors

### Debug Mode

Add this to your `.env.local` for detailed logging:

```env
VITE_DEBUG=true
```

### Getting Help

1. Check the [GitHub Issues](../../issues)
2. Review browser console for errors
3. Test in incognito/private mode
4. Try different devices/browsers

## 📊 Step 8: Analytics (Optional)

### Google Analytics Setup

1. Create Google Analytics account
2. Get tracking ID (G-XXXXXXXXXX)
3. Add to `index.html`:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

## 🔒 Step 9: Security Considerations

### Environment Variables

- Never commit `.env.local` to version control
- Use different keys for development/production
- Rotate keys regularly

### Supabase Security

- Enable Row Level Security (RLS) on all tables
- Use least-privilege access patterns
- Monitor usage in Supabase dashboard

### Content Security Policy

Add to `index.html` for production:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://www.googletagmanager.com;
  style-src 'self' 'unsafe-inline' https://api.mapbox.com;
  img-src 'self' data: https: blob:;
  connect-src 'self' https://*.supabase.co https://api.mapbox.com;
  media-src 'self' blob:;
">
```

## 🎯 Next Steps

Once your basic setup is complete:

1. **Customize branding** - Update colors, logos, app name
2. **Add ML integration** - Connect to Replicate API for pollen analysis
3. **Implement push notifications** - Set up service worker notifications
4. **Add user authentication** - Enable Supabase Auth
5. **Create admin dashboard** - Build admin interface for data management
6. **Set up monitoring** - Add error tracking and performance monitoring

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Mapbox Documentation](https://docs.mapbox.com/)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**Need help?** Open an issue on GitHub or contact the development team.
