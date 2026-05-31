# YT Learner Frontend - Production Deployment Guide

This guide covers deploying your frontend to production environments.

## 🚀 Deployment Options

### Option 1: Vercel (Recommended - Easiest)

Vercel is the best choice for static HTML/CSS/JS apps. Free tier includes:
- Automatic deployments from Git
- HTTPS with custom domain
- Global CDN
- Serverless functions (if needed)

#### Steps:

1. **Push to GitHub**
```bash
cd youtubelm
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/youtubelm.git
git push -u origin main
```

2. **Sign up at Vercel**
   - Go to https://vercel.com
   - Click "Sign Up"
   - Choose "GitHub" and authorize

3. **Import Project**
   - Click "Add New..." → "Project"
   - Select your repository
   - Configure:
     - Root Directory: `frontend`
     - Build Command: (leave empty)
     - Output Directory: `frontend`
   - Click "Deploy"

4. **Configure Environment**
   - After deployment, go to Settings
   - Add Environment Variable: `GOOGLE_CLIENT_ID`
   - Update `frontend/config.js` to use it:
     ```javascript
     const CONFIG = {
         GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'localhost_id',
         API_BASE_URL: 'https://your-backend.com',
     };
     ```

5. **Update Google OAuth**
   - Go to Google Cloud Console
   - Add Vercel domain to authorized origins
   - Example: `https://youtubelm.vercel.app`

6. **Update Backend CORS**
   ```java
   @CrossOrigin(origins = {
       "chrome-extension://*", 
       "http://localhost:3000",
       "https://youtubelm.vercel.app"
   })
   ```

---

### Option 2: Netlify

Another great static site host with similar features.

#### Steps:

1. **Push to GitHub** (same as Option 1)

2. **Sign up at Netlify**
   - Go to https://netlify.com
   - Click "Sign up"
   - Choose "GitHub"

3. **Deploy**
   - Click "Add new site" → "Import an existing project"
   - Select repository
   - Set Base directory: `frontend`
   - Click "Deploy site"

4. **Custom Domain**
   - Go to Domain settings
   - Add custom domain
   - Configure DNS

5. **Build Settings**
   - No build command needed (static site)
   - Publish directory: `frontend`

6. **Environment Variables**
   - Settings → Build & deploy → Environment
   - Add `GOOGLE_CLIENT_ID`

---

### Option 3: GitHub Pages

Free hosting directly from GitHub, but less flexible.

#### Steps:

1. **Create gh-pages branch**
```bash
git checkout -b gh-pages
# Copy frontend files to root
```

2. **Enable Pages**
   - GitHub → Settings → Pages
   - Choose branch: `gh-pages`
   - Save

3. **Update config.js**
   - Update `API_BASE_URL` to production backend
   - Update `GOOGLE_CLIENT_ID`

---

### Option 4: Traditional VPS/Server

For maximum control, deploy to your own server.

#### Prerequisites:
- Linux server (Ubuntu recommended)
- Node.js or Python installed
- Domain name
- SSL certificate (Let's Encrypt - free)

#### Steps:

1. **Connect to Server**
```bash
ssh user@your-server.com
```

2. **Install Dependencies**
```bash
# For http-server
curl -sL https://deb.nodesource.com/setup_16.x | sudo bash -
sudo apt install nodejs

# Or use Python (pre-installed on most servers)
```

3. **Upload Frontend**
```bash
scp -r frontend user@your-server.com:/var/www/ytlearner
```

4. **Setup Nginx (Reverse Proxy)**
```bash
sudo apt install nginx
```

Create `/etc/nginx/sites-available/ytlearner`:
```nginx
server {
    listen 443 ssl http2;
    server_name youtubelm.com www.youtubelm.com;

    ssl_certificate /etc/letsencrypt/live/youtubelm.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/youtubelm.com/privkey.pem;

    root /var/www/ytlearner/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name youtubelm.com www.youtubelm.com;
    return 301 https://$server_name$request_uri;
}
```

5. **Enable Site**
```bash
sudo ln -s /etc/nginx/sites-available/ytlearner /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

6. **Setup SSL Certificate**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d youtubelm.com -d www.youtubelm.com
```

7. **Start Application**
```bash
# Using Node.js http-server
cd /var/www/ytlearner/frontend
npx http-server -p 3000 &

# Or using Python
python3 -m http.server 3000 &
```

---

## 📝 Pre-Deployment Checklist

Before deploying to production:

### Code
- [ ] Remove all `localhost` references (except config.js)
- [ ] Remove all console.log() debug statements
- [ ] Update API_BASE_URL in config.js
- [ ] Update GOOGLE_CLIENT_ID in config.js
- [ ] Check for broken links
- [ ] Test all features locally

### Security
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] No sensitive data in frontend code
- [ ] Input validation working
- [ ] Error messages don't leak info

### Performance
- [ ] Images optimized
- [ ] CSS/JS minified (optional)
- [ ] Cache headers configured
- [ ] Load time acceptable (<3s)

### Configuration
- [ ] Google OAuth updated
- [ ] Backend CORS updated
- [ ] Backend running on production URL
- [ ] Database backed up
- [ ] Error logging configured

---

## 🔧 Production Configuration

### Update config.js for Production

```javascript
// config.js

const ENV = {
    development: {
        GOOGLE_CLIENT_ID: 'YOUR_DEV_CLIENT_ID',
        API_BASE_URL: 'http://localhost:8080'
    },
    production: {
        GOOGLE_CLIENT_ID: 'YOUR_PROD_CLIENT_ID',
        API_BASE_URL: 'https://api.youtubelm.com'
    }
};

const currentEnv = window.location.hostname === 'localhost' ? 'development' : 'production';

const CONFIG = {
    GOOGLE_CLIENT_ID: ENV[currentEnv].GOOGLE_CLIENT_ID,
    API_BASE_URL: ENV[currentEnv].API_BASE_URL,
    API_ENDPOINTS: {
        AUTH_LOGIN: '/api/auth/login',
        AUTH_ME: '/api/auth/me',
        AUTH_LOGOUT: '/api/auth/logout',
        TRACKED_VIDEOS: '/api/trivia/tracked',
        QUIZ_RESULTS: '/api/quiz/results',
        QUIZ_SAVE: '/api/quiz/results',
    }
};
```

### Update Google OAuth

1. Go to Google Cloud Console
2. For each environment, create separate OAuth Client IDs:
   - Development: `http://localhost:3000`
   - Production: `https://youtubelm.com`

### Update Backend

Update `SecurityConfig.java`:

```java
@CrossOrigin(origins = {
    "chrome-extension://*",
    "http://localhost:3000",
    "http://localhost:8080",
    "https://youtubelm.com",
    "https://www.youtubelm.com"
})
```

---

## 📊 Performance Optimization

### 1. Minify CSS/JavaScript

Using Node.js:
```bash
npm install -g terser clean-css-cli

# Minify CSS
cleancss styles.css -o styles.min.css

# Minify JavaScript
terser app.js -o app.min.js
terser auth.js -o auth.min.js
terser config.js -o config.min.js
```

Update HTML to use minified versions:
```html
<link rel="stylesheet" href="styles.min.css">
<script src="config.min.js"></script>
<script src="auth.min.js"></script>
<script src="app.min.js"></script>
```

### 2. Image Optimization

```bash
# Install imagemin
npm install -g imagemin imagemin-mozjpeg imagemin-pngquant

# Optimize images (if you add them)
imagemin images/ --out-dir=images/optimized
```

### 3. Enable Gzip Compression

Nginx:
```nginx
gzip on;
gzip_types text/plain text/css text/javascript application/json;
gzip_min_length 1000;
```

### 4. Add Caching Headers

Nginx:
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

---

## 🔒 Security Headers

Add to Nginx config:

```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' https: data: 'unsafe-inline'" always;
```

---

## 📈 Monitoring & Analytics

### Add Error Tracking (Optional)

Using Sentry:
```html
<script src="https://browser.sentry-cdn.com/7.0.0/bundle.min.js"></script>
<script>
  Sentry.init({ dsn: "YOUR_SENTRY_DSN" });
</script>
```

### Add Analytics (Optional)

Using Google Analytics:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

---

## 🚨 Troubleshooting Production Issues

### CORS Errors
- Check backend CORS configuration
- Verify domain is in allowed origins
- Check `@CrossOrigin` annotation

### Google OAuth Not Working
- Verify production Client ID is correct
- Check Google Cloud Console authorized origins
- Ensure HTTPS is enabled

### Videos Not Loading
- Check backend API URL in config.js
- Verify backend is running
- Check network tab in DevTools
- Look for 401 errors (JWT issues)

### Performance Issues
- Enable gzip compression
- Add caching headers
- Check server resources
- Monitor API response times

### 404 Errors on Refresh
- Configure server to serve index.html for all routes
- Nginx: Use `try_files $uri $uri/ /index.html;`
- Vercel/Netlify: Automatically handled

---

## 📋 Deployment Checklist

### Before Deploying
- [ ] Code reviewed
- [ ] All tests passing
- [ ] No console errors
- [ ] Google OAuth configured
- [ ] Backend CORS configured
- [ ] Database backup taken

### During Deployment
- [ ] Verify files uploaded correctly
- [ ] Check HTTPS certificate
- [ ] Test all features
- [ ] Monitor error logs
- [ ] Check performance metrics

### After Deployment
- [ ] Test login flow
- [ ] Test video loading
- [ ] Test search/sort
- [ ] Monitor uptime
- [ ] Set up alerts
- [ ] Document deployment

---

## 📞 Support & Help

### Deployment Platforms Help
- **Vercel**: https://vercel.com/docs
- **Netlify**: https://docs.netlify.com
- **GitHub Pages**: https://pages.github.com

### Server Deployment Help
- **Nginx**: https://nginx.org/en/docs/
- **Let's Encrypt**: https://letsencrypt.org/
- **Ubuntu**: https://ubuntu.com/server/docs

---

## 🎯 Next Steps After Deployment

1. **Monitor**
   - Set up uptime monitoring
   - Monitor error rates
   - Track performance metrics

2. **Maintain**
   - Keep dependencies updated
   - Monitor security advisories
   - Regular backups

3. **Improve**
   - Gather user feedback
   - Optimize based on analytics
   - Add new features

4. **Scale**
   - Load testing
   - Database optimization
   - Caching strategies

---

**Congratulations!** Your YT Learner frontend is now live! 🎉
