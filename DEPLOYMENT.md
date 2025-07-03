# CrowdPollen Deployment Guide

## 🚀 Quick Deploy to Vercel

### Prerequisites
- Node.js 18+ installed
- Git repository
- Vercel account (free)

### Step 1: Prepare Environment Variables
Create a `.env.local` file with:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 2: Deploy to Vercel

#### Option A: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts:
# - Set up and deploy: Y
# - Which scope: (your account)
# - Link to existing project: N
# - Project name: crowdpollen
# - Directory: ./
# - Override settings: N
```

#### Option B: Using Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Set Framework Preset to "Vite"
5. Add environment variables
6. Deploy

### Step 3: Configure Environment Variables in Vercel
1. Go to your project dashboard
2. Settings → Environment Variables
3. Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Redeploy

### Step 4: Test PWA Features
1. Open deployed URL on mobile
2. Test "Add to Home Screen"
3. Test offline functionality
4. Test camera access

## 📱 Mobile Testing

### iOS Safari
- Camera requires HTTPS
- Add to Home Screen creates app icon
- Service worker caches for offline use

### Android Chrome
- Camera works on HTTP localhost
- PWA install prompt appears
- Background sync available

## 🔧 Troubleshooting

### Camera Not Working
- Ensure HTTPS in production
- Check browser permissions
- Test on different devices

### Service Worker Issues
- Clear browser cache
- Check console for errors
- Verify sw.js is accessible

### Supabase Connection
- Verify environment variables
- Check network requests in DevTools
- Confirm RLS policies

## 🎯 Performance Optimization

### Lighthouse Scores Target
- Performance: >90
- Accessibility: >95
- Best Practices: >90
- SEO: >90
- PWA: >90

### Optimization Tips
- Images are optimized (WebP format)
- Service worker caches static assets
- Lazy loading for non-critical components
- Minimal bundle size with tree shaking

## 📊 Analytics Setup

### Google Analytics (Optional)
Add to `index.html`:
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 🔒 Security Considerations

### Environment Variables
- Never commit `.env.local` to Git
- Use Vercel's environment variable system
- Rotate keys regularly

### Supabase Security
- RLS policies are enabled
- Anonymous access is limited
- API keys are properly scoped

## 📈 Monitoring

### Error Tracking
- Console errors are logged
- Service worker errors are handled
- Network failures are graceful

### Performance Monitoring
- Core Web Vitals tracking
- User journey analytics
- API response times

## 🔄 Updates and Maintenance

### Updating the App
1. Make changes locally
2. Test thoroughly
3. Push to Git repository
4. Vercel auto-deploys

### Database Migrations
- Use Supabase dashboard
- Test on staging first
- Backup before major changes

### Service Worker Updates
- Increment cache version
- Test offline functionality
- Clear old caches

## 📞 Support

### Common Issues
- Camera permissions
- Location access
- Offline functionality
- Image upload failures

### Debug Tools
- Browser DevTools
- Vercel deployment logs
- Supabase dashboard logs
- Service worker debugging

---

## ✅ Deployment Checklist

- [ ] Environment variables configured
- [ ] Supabase database setup
- [ ] RLS policies enabled
- [ ] Service worker registered
- [ ] PWA manifest valid
- [ ] Camera permissions working
- [ ] Offline functionality tested
- [ ] Mobile responsive design
- [ ] Performance optimized
- [ ] Analytics configured (optional)
- [ ] Error handling implemented
- [ ] Security measures in place

Your CrowdPollen app is now ready for production! 🎉
