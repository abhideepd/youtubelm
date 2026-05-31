# YT Learner - Frontend

A simple, responsive HTML/CSS/JavaScript frontend for the YT Learner application. Users can log in with Google OAuth and view all videos they've tracked using the Chrome Extension.

## 📋 Features

- **Google OAuth Login**: Secure authentication with Google
- **Dashboard**: View all tracked videos from the extension
- **Video Management**: 
  - Search videos by title or channel
  - Sort videos (recent, oldest, alphabetical)
  - View video details
  - Quick link to watch on YouTube
- **Statistics**: Track learning progress
  - Total videos tracked
  - Quizzes completed
  - Average quiz scores
  - Summaries generated (when tracking is added to backend)

## 🚀 Setup Instructions

### 1. **Google OAuth Configuration**

You need to set up Google OAuth 2.0 credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the "Google+ API"
4. Go to "Credentials" → Create OAuth 2.0 Client ID (Web Application)
5. Add authorized JavaScript origins and redirect URIs:
   - For local development: `http://localhost:3000`
   - For production: your domain
6. Copy the **Client ID**

### 2. **Update Configuration**

Edit `config.js` and replace the placeholder with your Google Client ID:

```javascript
const CONFIG = {
    GOOGLE_CLIENT_ID: 'YOUR_ACTUAL_CLIENT_ID_HERE.apps.googleusercontent.com',
    API_BASE_URL: 'http://localhost:8080',
    // ...
};
```

### 3. **Update Backend CORS**

Make sure your Spring Boot backend allows requests from your frontend domain. Edit `SecurityConfig.java` in your backend:

```java
@CrossOrigin(origins = {"chrome-extension://*", "http://localhost:3000", "http://localhost:8000"})
```

Update the allowed origins to match where you're hosting your frontend.

### 4. **Start the Frontend**

Option A: Using Python's built-in server
```bash
cd frontend
python -m http.server 3000
```

Option B: Using Node.js http-server
```bash
npm install -g http-server
cd frontend
http-server -p 3000
```

Option C: Using VS Code Live Server extension
- Install "Live Server" extension in VS Code
- Right-click `index.html` → "Open with Live Server"

### 5. **Access the Application**

Open your browser and go to `http://localhost:3000`

## 📦 Project Structure

```
frontend/
├── index.html          # Main HTML file
├── styles.css          # All styling
├── config.js           # Configuration and API helpers
├── auth.js             # Authentication logic
├── app.js              # Main application logic
└── README.md           # This file
```

## 🔐 Authentication Flow

1. User opens the frontend
2. User clicks "Sign in with Google" or enters a username
3. Frontend sends credentials to backend
4. Backend validates and returns JWT token
5. Frontend stores JWT in localStorage
6. All subsequent API requests include JWT in Authorization header

## 🎨 Styling

The frontend uses a modern, dark-themed UI with:
- Purple/violet accent colors
- Responsive grid layouts
- Smooth animations and transitions
- Mobile-friendly design

Customize colors by editing CSS variables in `styles.css`:

```css
:root {
    --primary-color: #7c3aed;
    --secondary-color: #ec4899;
    --dark-bg: #0f172a;
    /* ... more variables */
}
```

## 📡 API Endpoints Used

The frontend communicates with these backend endpoints:

- `POST /api/auth/login` - Google OAuth login
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout
- `GET /api/quiz/results/{username}` - Get quiz results (to infer tracked videos)
- *(Optional)* `GET /api/trivia/tracked/{username}` - Get tracked videos (needs to be added to backend)

## ⚙️ Browser Compatibility

- Chrome/Edge (version 80+)
- Firefox (version 75+)
- Safari (version 13+)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🔧 Backend Enhancements (Optional)

To fully leverage the frontend, consider adding these endpoints to your backend:

### Get Tracked Videos for a User

```java
@GetMapping(value="/api/trivia/tracked/{username}", produces = MediaType.APPLICATION_JSON_VALUE)
public ResponseEntity<TrackedVideosResponse> getTrackedVideos(@PathVariable String username) {
    Map<String, String> videos = trackedVideos.getOrDefault(username, new HashMap<>());
    return ResponseEntity.ok(new TrackedVideosResponse(
        videos.entrySet().stream()
            .map(e -> new VideoInfo(e.getKey(), e.getValue()))
            .collect(Collectors.toList())
    ));
}
```

### Remove Tracked Video

```java
@DeleteMapping(value="/api/trivia/tracked/{username}/{videoId}")
public ResponseEntity<Void> removeTrackedVideo(@PathVariable String username, @PathVariable String videoId) {
    trackedVideos.getOrDefault(username, new HashMap<>()).remove(videoId);
    return ResponseEntity.ok().build();
}
```

## 🐛 Troubleshooting

### Google Login Not Working
- Ensure Client ID is correctly set in `config.js`
- Check browser console for CORS errors
- Verify authorized origins in Google Cloud Console

### Videos Not Loading
- Check Network tab in DevTools to see API responses
- Ensure backend is running on `http://localhost:8080`
- Verify JWT token is being sent in Authorization header

### CORS Errors
- Update `SecurityConfig.java` in backend to allow frontend domain
- Check that API endpoints have `@CrossOrigin` annotation

## 📝 Notes

- Videos are loaded from quiz results currently (since backend tracks videos in-memory)
- For production, you should persist tracked videos in a database
- Add proper error handling for network failures
- Implement token refresh mechanism for long-lived sessions
- Consider adding PWA support for offline access

## 🤝 Integration with Chrome Extension

The frontend displays videos tracked through the YT Learner Chrome Extension:

1. User installs the extension
2. While watching videos, user clicks "Track" in the extension
3. Extension sends video info to backend
4. Frontend retrieves and displays these tracked videos

## 📄 License

Same as YT Learner project
