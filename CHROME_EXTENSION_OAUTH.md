# Chrome Extension: OAuth Integration Guide

## Overview

This guide explains how to integrate the Google OAuth authentication system with your Chrome extension popup.

## File Structure

```
ytlearner-plugin/ytlearner/chrome-extension/
├── manifest.json                    (Already configured)
├── popup.html                       (MODIFY - Add login UI)
├── popup.css                        (MODIFY - Style login screen)
├── js/
│   ├── popup.js                     (MODIFY - Add OAuth flow)
│   ├── background.js                (MODIFY - Token management)
│   └── content.js                   (Already configured)
└── icons/
    └── icon*.png                    (Already configured)
```

## Step 1: Update manifest.json

```json
{
  "manifest_version": 3,
  "name": "YT Learner",
  "version": "1.0.0",
  "permissions": [
    "storage",
    "identity",
    "tabs",
    "webRequest",
    "cookies"
  ],
  "host_permissions": [
    "https://www.youtube.com/*",
    "http://localhost:8080/*",
    "https://youtubelm.com/*"
  ],
  "oauth2": {
    "client_id": "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
    "scopes": [
      "profile",
      "email",
      "https://www.googleapis.com/auth/youtube.readonly"
    ]
  },
  "background": {
    "service_worker": "js/background.js"
  },
  "action": {
    "default_popup": "popup.html",
    "default_title": "YT Learner"
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

## Step 2: Update popup.html

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>YT Learner</title>
    <link rel="stylesheet" href="css/popup.css">
</head>
<body>
    <!-- Login Screen (Hidden by default) -->
    <div id="loginContainer" style="display:none; padding: 20px; text-align: center;">
        <div class="empty-icon" style="font-size: 48px; margin: 20px 0;">🔐</div>
        <h2 style="font-size: 16px; margin: 10px 0;">Sign in with YouTube</h2>
        <p style="color: #666; font-size: 12px; margin: 10px 0;">
            To use YT Learner, sign in with your YouTube/Google account.
        </p>
        <button class="primary-btn full-width" id="googleLoginBtn" style="margin-top: 15px;">
            <span style="margin-right: 8px;">▶</span> Sign in with Google
        </button>
        <p style="color: #999; font-size: 11px; margin-top: 15px;">
            Your YouTube account will be used only for authentication.
        </p>
        <div id="loginError" style="color: #d32f2f; margin-top: 10px; font-size: 12px; display: none;"></div>
    </div>

    <!-- Main Dashboard (Shown when authenticated) -->
    <div id="appContainer" style="display:none;">
        <!-- User Profile -->
        <div class="user-header">
            <img id="userProfile" src="" alt="Profile" class="profile-img" style="width: 40px; height: 40px; border-radius: 50%;">
            <div style="flex: 1;">
                <div id="userName" style="font-weight: bold;"></div>
                <small id="userEmail" style="color: #666;"></small>
            </div>
            <button id="logoutBtn" style="background: none; border: none; cursor: pointer; font-size: 20px; padding: 0;">⋮</button>
        </div>

        <!-- Tabs (Summary, Quiz, Q&A, Trivia) -->
        <div id="tabButtons">
            <button class="tab-button active" data-tab="summary">Summary</button>
            <button class="tab-button" data-tab="quiz">Quiz</button>
            <button class="tab-button" data-tab="qa">Q&A</button>
            <button class="tab-button" data-tab="trivia">Trivia</button>
        </div>

        <!-- Tab Content -->
        <div id="summaryTab" class="tab-content active"></div>
        <div id="quizTab" class="tab-content"></div>
        <div id="qaTab" class="tab-content"></div>
        <div id="triviaTab" class="tab-content"></div>
    </div>

    <!-- Loading Spinner -->
    <div id="loadingSpinner" style="display: none; text-align: center; padding: 20px;">
        <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
    </div>

    <style>
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .user-header {
            display: flex;
            align-items: center;
            padding: 10px;
            border-bottom: 1px solid #eee;
            gap: 10px;
        }
    </style>

    <script src="js/popup.js"></script>
</body>
</html>
```

## Step 3: Update popup.js

```javascript
/**
 * YT Learner Extension - Popup Script
 * Handles authentication, UI display, and tab navigation
 */

const API_BASE = 'http://localhost:8080';
const AUTH_TOKEN_KEY = 'ytlearner_jwt_token';
const AUTH_USER_KEY = 'ytlearner_auth_user';
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

// ============ Initialization ============

document.addEventListener('DOMContentLoaded', async () => {
    console.log('YT Learner popup loaded');
    
    // Check authentication status
    const isAuthenticated = await checkAuthentication();
    
    if (isAuthenticated) {
        showAppUI();
        loadUserProfile();
    } else {
        showLoginUI();
        setupLoginHandlers();
    }
});

// ============ Authentication ============

/**
 * Check if user has valid JWT token
 */
async function checkAuthentication() {
    return new Promise((resolve) => {
        chrome.storage.local.get(AUTH_TOKEN_KEY, (result) => {
            if (result[AUTH_TOKEN_KEY]) {
                // In production, validate with backend
                console.log('JWT token found');
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}

/**
 * Show login UI
 */
function showLoginUI() {
    document.getElementById('loginContainer').style.display = 'block';
    document.getElementById('appContainer').style.display = 'none';
}

/**
 * Show app UI
 */
function showAppUI() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
}

/**
 * Setup login button handler
 */
function setupLoginHandlers() {
    const loginBtn = document.getElementById('googleLoginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', initiateGoogleLogin);
    }
}

/**
 * Initiate Google OAuth flow using Chrome identity API
 */
async function initiateGoogleLogin() {
    console.log('Starting Google OAuth flow...');
    
    const redirectUrl = chrome.identity.getRedirectURL();
    console.log('Redirect URL:', redirectUrl);

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', redirectUrl);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'openid email profile https://www.googleapis.com/auth/youtube.readonly');
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent');

    try {
        showLoading(true);
        
        const finalUrl = await chrome.identity.launchWebAuthFlow({
            url: authUrl.toString(),
            interactive: true
        });

        console.log('OAuth redirect:', finalUrl);

        // Extract authorization code
        const url = new URL(finalUrl);
        const code = url.searchParams.get('code');

        if (code) {
            await exchangeCodeForToken(code);
        } else {
            showError('Authentication failed: No authorization code received');
            console.error('No authorization code in redirect URL');
        }
    } catch (e) {
        console.error('OAuth flow failed', e);
        showError(`Login failed: ${e.message}`);
    } finally {
        showLoading(false);
    }
}

/**
 * Exchange authorization code for tokens
 */
async function exchangeCodeForToken(code) {
    try {
        console.log('Exchanging code for token...');

        // Your backend should handle this exchange
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: code,
                redirectUri: chrome.identity.getRedirectURL()
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`Token exchange failed: ${error.message || response.status}`);
        }

        const data = await response.json();
        console.log('Authentication successful');

        // Store JWT token
        chrome.storage.local.set({
            [AUTH_TOKEN_KEY]: data.jwtToken,
            [AUTH_USER_KEY]: data.youtubeId
        });

        // Update UI
        showToast('✅ Logged in successfully!');
        setTimeout(() => location.reload(), 1000);

    } catch (e) {
        console.error('Token exchange error', e);
        showError(`Authentication error: ${e.message}`);
    }
}

// ============ User Profile ============

/**
 * Load current user profile
 */
async function loadUserProfile() {
    try {
        const token = await getAuthToken();
        if (!token) return;

        const response = await fetch(`${API_BASE}/api/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const user = await response.json();
            console.log('User profile loaded:', user);

            // Update UI
            document.getElementById('userProfile').src = user.profileImage || '';
            document.getElementById('userName').textContent = user.displayName || 'User';
            document.getElementById('userEmail').textContent = user.email || '';

            setupLogoutHandler();
        } else {
            // Token invalid, logout
            await logout();
        }
    } catch (error) {
        console.error('Error loading user profile', error);
    }
}

/**
 * Setup logout handler
 */
function setupLogoutHandler() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            const confirmation = confirm('Are you sure you want to logout?');
            if (confirmation) {
                await logout();
            }
        });
    }
}

/**
 * Logout user
 */
async function logout() {
    try {
        const token = await getAuthToken();
        
        // Notify backend
        await fetch(`${API_BASE}/api/auth/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).catch(e => console.error('Logout error:', e));

        // Clear local storage
        chrome.storage.local.remove([AUTH_TOKEN_KEY, AUTH_USER_KEY]);
        console.log('User logged out');

        // Show login UI
        showLoginUI();
        setupLoginHandlers();
        showToast('✅ Logged out successfully');
    } catch (error) {
        console.error('Logout failed', error);
        showError('Logout failed');
    }
}

// ============ Utilities ============

/**
 * Get JWT token from storage
 */
async function getAuthToken() {
    return new Promise((resolve) => {
        chrome.storage.local.get(AUTH_TOKEN_KEY, (result) => {
            resolve(result[AUTH_TOKEN_KEY] || null);
        });
    });
}

/**
 * Show loading spinner
 */
function showLoading(show) {
    document.getElementById('loadingSpinner').style.display = show ? 'block' : 'none';
}

/**
 * Show toast notification
 */
function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #323232;
        color: white;
        padding: 12px 16px;
        border-radius: 4px;
        font-size: 14px;
        z-index: 1000;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

/**
 * Show error message in login form
 */
function showError(message) {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
    console.error('Error:', message);
}

// ============ API Calls with Auth ============

/**
 * Make authenticated API call
 */
async function apiCall(endpoint, options = {}) {
    const token = await getAuthToken();
    
    if (!token) {
        throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        }
    });

    if (response.status === 401) {
        // Token invalid, logout
        await logout();
        throw new Error('Session expired');
    }

    return response;
}

// ============ Example: Tab Navigation ============

/**
 * Setup tab buttons
 */
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.style.display = 'none';
            });
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });

            // Show selected tab
            document.getElementById(tabName + 'Tab').style.display = 'block';
            button.classList.add('active');
        });
    });
}

// Initialize tabs when app UI is shown
document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
});
```

## Step 4: Update background.js

```javascript
/**
 * YT Learner Extension - Background Service Worker
 * Handles token management and cross-tab communication
 */

const AUTH_TOKEN_KEY = 'ytlearner_jwt_token';

// Token refresh on startup
chrome.runtime.onStartup.addListener(() => {
    console.log('Extension started, checking auth status');
    checkTokenValidity();
});

// Token refresh on install
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});

/**
 * Check if JWT token is still valid
 */
async function checkTokenValidity() {
    const token = await getToken();
    if (!token) return;

    try {
        const response = await fetch('http://localhost:8080/api/auth/validate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            console.warn('Token is invalid, clearing storage');
            chrome.storage.local.remove(AUTH_TOKEN_KEY);
        }
    } catch (error) {
        console.error('Token validation failed', error);
    }
}

/**
 * Get token from storage
 */
async function getToken() {
    return new Promise((resolve) => {
        chrome.storage.local.get(AUTH_TOKEN_KEY, (result) => {
            resolve(result[AUTH_TOKEN_KEY] || null);
        });
    });
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_TOKEN') {
        getToken().then(token => sendResponse({ token }));
    }
});
```

## Step 5: Update popup.css

Add styling for login screen:

```css
/* Login Button */
.primary-btn {
    background-color: #1f2937;
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
}

.primary-btn:hover {
    background-color: #374151;
}

.primary-btn:active {
    background-color: #111827;
}

.full-width {
    width: 100%;
    box-sizing: border-box;
}

/* User Header */
.user-header {
    display: flex;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
}

.profile-img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
}

/* Tabs */
#tabButtons {
    display: flex;
    border-bottom: 2px solid #e5e7eb;
}

.tab-button {
    flex: 1;
    padding: 10px;
    border: none;
    background: white;
    cursor: pointer;
    font-size: 13px;
    border-bottom: 3px solid transparent;
    transition: all 0.2s;
}

.tab-button.active {
    color: #3b82f6;
    border-bottom-color: #3b82f6;
}

.tab-button:hover:not(.active) {
    background: #f3f4f6;
}

/* Popup base */
body {
    width: 400px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1f2937;
}
```

## Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project "YT Learner"
3. Enable these APIs:
   - YouTube Data API v3
   - Google Identity Services
4. Create OAuth 2.0 credentials:
   - **Type**: Chrome App
   - **Application ID**: (Get from `chrome://extensions/` after loading unpacked extension)
5. Copy `GOOGLE_CLIENT_ID` and update:
   - `manifest.json`: `oauth2.client_id`
   - `popup.js`: `GOOGLE_CLIENT_ID`

## Testing

### Local Development

1. Update `API_BASE` in `popup.js`:
   ```javascript
   const API_BASE = 'http://localhost:8080';
   ```

2. Load extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `chrome-extension/` folder

3. Open popup and test login flow

### Production

1. Update `API_BASE`:
   ```javascript
   const API_BASE = 'https://api.youtubelm.com';
   ```

2. Publish to Chrome Web Store

## Security Notes

✅ **Implemented**:
- JWT tokens stored in secure `chrome.storage.local`
- Authorization header included in all API calls
- Automatic logout on token expiration
- CORS protection

⚠️ **Important**:
- Never store tokens in `localStorage` (vulnerable to XSS)
- Always use HTTPS in production
- Validate all user inputs
- Implement rate limiting

---

**Status**: Ready to implement
**Testing Required**: End-to-end OAuth flow testing
**Deployment**: After backend is running
