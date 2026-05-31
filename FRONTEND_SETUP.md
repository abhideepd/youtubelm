# YT Learner Frontend - Quick Setup Guide

## 🎯 What You Just Got

A complete, modern web frontend for your YT Learner application that allows users to:
- ✅ Log in with Google OAuth
- ✅ View all videos they've tracked via the Chrome Extension
- ✅ Search and sort videos
- ✅ View learning statistics
- ✅ Responsive, dark-themed UI

## 📁 Files Created

```
frontend/
├── index.html      - Main HTML with login and dashboard
├── styles.css      - Complete styling (mobile responsive)
├── config.js       - Configuration & API helpers
├── auth.js         - Google OAuth & authentication logic
├── app.js          - Dashboard logic & data management
└── README.md       - Detailed documentation
```

## ⚡ Quick Start (5 minutes)

### Step 1: Get Google OAuth Client ID

1. Go to: https://console.cloud.google.com/
2. Create a new project (if needed)
3. Enable "Google+ API"
4. Go to Credentials → Create OAuth 2.0 Client ID
5. Select "Web Application"
6. Add authorized origin: `http://localhost:3000`
7. Copy your **Client ID**

### Step 2: Configure Frontend

Open `frontend/config.js` and replace:
```javascript
const CONFIG = {
    GOOGLE_CLIENT_ID: 'PASTE_YOUR_CLIENT_ID_HERE.apps.googleusercontent.com',
    API_BASE_URL: 'http://localhost:8080',
    // rest stays the same
};
```

### Step 3: Update Backend CORS

Open your `SecurityConfig.java` (in backend) and ensure:
```java
@CrossOrigin(origins = {"chrome-extension://*", "http://localhost:3000"})
```

### Step 4: Run Frontend

```bash
cd frontend

# Option 1: Python
python -m http.server 3000

# Option 2: Node http-server
npx http-server -p 3000

# Option 3: VS Code Live Server
# Right-click index.html → Open with Live Server
```

### Step 5: Open in Browser

```
http://localhost:3000
```

That's it! 🎉

## 🔄 How It Works

### Login Flow
```
User clicks "Sign in with Google"
         ↓
Browser shows Google consent screen
         ↓
Google returns ID token to frontend
         ↓
Frontend sends token to your backend (/api/auth/login)
         ↓
Backend validates token & returns JWT
         ↓
Frontend stores JWT & shows dashboard
```

### Data Flow
```
Frontend loads → Checks for JWT in localStorage
         ↓
If logged in → Fetches quiz results from backend
         ↓
Extracts unique videos from results
         ↓
Renders videos in grid with search/sort
```

## 🎨 Features Overview

### 1. **Login Page**
- Google OAuth button
- Guest login option (username only)
- Beautiful animated UI

### 2. **Dashboard**
Two tabs:

**Videos Tab**
- Grid of tracked videos
- Search by title/channel
- Sort by date or title
- Click video for details
- Direct YouTube links

**Statistics Tab**
- Total videos tracked
- Quizzes completed
- Average quiz score
- Summaries generated

### 3. **Responsive Design**
- Works on desktop, tablet, mobile
- Touch-friendly buttons
- Optimized layouts for all screen sizes

## 🔌 API Integration

The frontend uses these backend endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/login` | Google OAuth login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/quiz/results/{username}` | Get quiz history (shows tracked videos) |

**Note:** The backend currently stores tracked videos in memory. The frontend extracts them from quiz results or (if you add it) from a dedicated tracked videos endpoint.

## 🚀 What to Do Next

### For Development
1. Test login with Google account
2. Add some videos via Chrome Extension
3. Refresh dashboard to see videos
4. Test search and sort
5. Check browser console for any errors

### For Production
1. Get a real domain
2. Update Google OAuth authorized origins
3. Add HTTPS (required for OAuth)
4. Deploy frontend (Vercel, Netlify, or your server)
5. Update backend CORS settings
6. Add database persistence for videos (currently in-memory)

## 📊 Customization Ideas

### Colors
Edit `styles.css` root variables:
```css
:root {
    --primary-color: #7c3aed;      /* Purple */
    --secondary-color: #ec4899;    /* Pink */
    --dark-bg: #0f172a;            /* Dark blue */
}
```

### Add Features
- Add video rating/favoriting
- Display quiz detailed results
- Show video summaries
- Add video categories
- Implement spaced repetition viewing

### Backend Enhancements
- Add `/api/trivia/tracked/{username}` endpoint
- Persist videos to database (JPA)
- Add video metadata caching
- Implement video deletion endpoint

## ⚠️ Troubleshooting

### Problem: "Cannot read property 'credential' of undefined"
**Solution:** Make sure Google Client ID is correct in `config.js`

### Problem: "CORS error"
**Solution:** Update `@CrossOrigin` in backend to include `http://localhost:3000`

### Problem: "Videos not showing"
**Solution:** Check Network tab in DevTools. Make sure:
1. Backend is running on 8080
2. You have JWT token in localStorage
3. Backend has quiz results data

### Problem: Login redirects to login page
**Solution:** Check console for errors. Usually means:
1. JWT validation failed in backend
2. User data not being saved to localStorage

## 📱 Mobile Testing

To test on actual mobile device:

1. Get your computer's IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Start server: `python -m http.server 3000`
3. On mobile, visit: `http://<YOUR_IP>:3000`

## 🔐 Security Notes

- JWT tokens stored in localStorage (consider HttpOnly cookies for production)
- Google OAuth provides authentication
- Backend should validate tokens
- Consider rate limiting on API endpoints
- Add HTTPS in production

## 📞 Need Help?

1. Check browser console (F12 → Console tab)
2. Check Network tab to see API responses
3. Check backend logs for errors
4. Review README.md in frontend folder

---

**You're all set!** Go ahead and test it out. 🚀
