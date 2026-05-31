# YT Learner Frontend - Integration Checklist

## ✅ Getting Started

- [ ] Downloaded/created frontend folder with all files
- [ ] Reviewed the structure (index.html, styles.css, config.js, auth.js, app.js)
- [ ] Read FRONTEND_SETUP.md
- [ ] Have Google Cloud Console access

## 🔐 Google OAuth Setup

- [ ] Created Google Cloud project
- [ ] Enabled Google+ API
- [ ] Created OAuth 2.0 Client ID (Web Application)
- [ ] Added `http://localhost:3000` as authorized origin
- [ ] Added `http://localhost:3000` as authorized redirect URI
- [ ] Copied Client ID

## ⚙️ Frontend Configuration

- [ ] Opened `frontend/config.js`
- [ ] Replaced `YOUR_GOOGLE_CLIENT_ID` with actual Client ID
- [ ] Verified `API_BASE_URL` is `http://localhost:8080`
- [ ] Saved the file

## 🔧 Backend Configuration

- [ ] Located `backend/src/main/java/com/ytlearner/config/SecurityConfig.java`
- [ ] Updated `@CrossOrigin` annotation to include `http://localhost:3000`
- [ ] Example:
  ```java
  @CrossOrigin(origins = {"chrome-extension://*", "http://localhost:3000"})
  ```
- [ ] Rebuilt backend (mvn clean build or gradle clean build)
- [ ] Backend is running on `http://localhost:8080`

## 🚀 Running the Frontend

### Choose one method:

#### Method 1: Python (Built-in)
- [ ] Terminal: `cd frontend`
- [ ] Terminal: `python -m http.server 3000`
- [ ] Browser: `http://localhost:3000`

#### Method 2: Node.js HTTP Server
- [ ] Terminal: `npm install -g http-server` (if not installed)
- [ ] Terminal: `cd frontend`
- [ ] Terminal: `http-server -p 3000`
- [ ] Browser: `http://localhost:3000`

#### Method 3: VS Code Live Server
- [ ] Install "Live Server" extension in VS Code
- [ ] Right-click `index.html` in frontend folder
- [ ] Click "Open with Live Server"
- [ ] Browser opens automatically

## 🧪 Testing Login

- [ ] Page loads with login screen
- [ ] Google sign-in button is visible
- [ ] Guest login input is visible
- [ ] Click "Sign in with Google"
- [ ] Google consent screen appears
- [ ] After accepting, redirected to dashboard
- [ ] User name and email displayed in header
- [ ] Browser console has no errors

## 📺 Testing Videos Display

### If you have videos tracked via Chrome Extension:

- [ ] Dashboard loads without errors
- [ ] "Videos" tab is active
- [ ] Loading spinner appears briefly
- [ ] Videos display in grid (if any tracked)
- [ ] Video thumbnails load
- [ ] Video titles and channels display correctly

### If no videos appear:

- [ ] This is expected! Videos come from the Chrome Extension
- [ ] Use Chrome Extension to track a video first
- [ ] Refresh dashboard to see tracked videos

## 🔍 Testing Features

- [ ] Search box filters videos
- [ ] Sort dropdown works (recent/oldest/title)
- [ ] Click "Details" on a video card
- [ ] Modal shows video info
- [ ] "View on YouTube" button works
- [ ] "Remove from Tracked" button works
- [ ] Statistics tab shows numbers (even if 0)
- [ ] Logout button works
- [ ] Logging back in shows same data

## 📱 Testing Responsiveness

- [ ] Open DevTools (F12)
- [ ] Click responsive design mode (Ctrl+Shift+M)
- [ ] Test at different screen sizes:
  - [ ] Mobile (375px)
  - [ ] Tablet (768px)
  - [ ] Desktop (1920px)
- [ ] All buttons clickable
- [ ] Text readable
- [ ] Layout adapts properly

## 🐛 Debugging Checklist

If something doesn't work:

- [ ] Open DevTools Console (F12)
- [ ] Check for red error messages
- [ ] Look at Network tab
- [ ] Check if API requests are succeeding (200 status)
- [ ] Verify JWT token in localStorage:
  ```javascript
  // In console:
  localStorage.getItem('ytlearner_jwt_token')
  localStorage.getItem('ytlearner_current_user')
  ```
- [ ] Check backend logs for errors
- [ ] Verify backend is running: `curl http://localhost:8080/api/auth/me -H "Authorization: Bearer YOUR_TOKEN"`

## 🎨 Customization (Optional)

- [ ] Changed primary color in `styles.css` (optional)
- [ ] Added custom logo/branding (optional)
- [ ] Modified button text or UI copy (optional)
- [ ] Tested customizations in all browsers

## 📦 Chrome Extension Integration

- [ ] Chrome Extension installed and running
- [ ] Extension API URL set to `http://localhost:8080`
- [ ] Extension username set (preferably match Google email)
- [ ] Tracked a video using the extension
- [ ] Video appears in frontend dashboard

## 🚢 Pre-Production Checklist

- [ ] All console errors resolved
- [ ] Tested login flow end-to-end
- [ ] Tested with actual Google account
- [ ] Tested with Chrome Extension
- [ ] Responsive design works
- [ ] No hardcoded localhost URLs (except config.js)
- [ ] Error handling working (bad network, timeouts)
- [ ] Logout and login again works smoothly

## 🌐 Production Deployment (Optional)

- [ ] Registered domain or got hosting
- [ ] HTTPS certificate obtained
- [ ] Updated Google OAuth allowed origins
- [ ] Updated backend CORS settings
- [ ] Updated `config.js` with production URL
- [ ] Built optimized version
- [ ] Deployed to production server
- [ ] Tested in production environment
- [ ] Set up error monitoring
- [ ] Configured analytics (optional)

## 📋 Backend Enhancements (Optional)

- [ ] Read BACKEND_ENHANCEMENTS.md
- [ ] Created VideoInfo DTO
- [ ] Created TrackedVideosResponse DTO
- [ ] Added GET /api/trivia/tracked/{username} endpoint
- [ ] Added DELETE /api/trivia/tracked/{username}/{videoId} endpoint
- [ ] Tested new endpoints with Postman or curl
- [ ] Frontend automatically uses new endpoints

## 📚 Documentation

- [ ] Shared README.md with team
- [ ] Shared FRONTEND_SETUP.md for setup instructions
- [ ] Created deployment documentation
- [ ] Created API documentation
- [ ] Added troubleshooting guide

## ✨ Final Verification

- [ ] User can log in
- [ ] User can see tracked videos
- [ ] User can search and sort
- [ ] User can view video details
- [ ] User can logout and login again
- [ ] Statistics display correctly
- [ ] Mobile experience is smooth
- [ ] No console errors

---

## 🎉 You're Done!

If all checkboxes are complete, your YT Learner frontend is ready to use!

### Quick Links:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`
- Chrome Extension: Open any YouTube video

### Need Help?
1. Check browser console for errors
2. Review FRONTEND_SETUP.md
3. Check backend logs
4. Verify API endpoints are accessible

### Next Steps:
1. Deploy to production
2. Add more features (ratings, notes, etc.)
3. Enhance backend with database
4. Set up monitoring and analytics
5. Gather user feedback

Happy learning! 📚✨
