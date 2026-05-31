# YT Learner Authentication System Implementation Guide

## Overview

This document describes the complete OAuth 2.0 + JWT authentication system implemented for YT Learner, enabling seamless YouTube login integration for both the Chrome extension and future web platform.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Chrome Extension (Manifest V3)                 │
├─────────────────────────────────────────────────────────────┤
│  popup.html/js                                              │
│  ├─ Detects YouTube login status                            │
│  ├─ Initiates Google OAuth flow (chrome.identity API)       │
│  └─ Stores JWT token in chrome.storage.local                │
│                                                              │
└────────────────┬──────────────────────────────────────────┘
                 │ POST /api/auth/login (Google ID Token)
                 ▼
┌─────────────────────────────────────────────────────────────┐
│         Spring Boot Backend (YT Learner API)                │
├─────────────────────────────────────────────────────────────┤
│  AuthController.java                                        │
│  ├─ POST   /api/auth/login      (Google OAuth)              │
│  ├─ GET    /api/auth/me         (Current user)              │
│  ├─ POST   /api/auth/logout     (Session end)               │
│  └─ POST   /api/auth/validate   (Token check)               │
│                                                              │
│  UserService.java                                           │
│  ├─ verifyGoogleToken()         (OAuth validation)          │
│  ├─ findOrCreateUser()          (DB persistence)            │
│  └─ generateJwtToken()          (Auth token)                │
│                                                              │
│  JwtConfig.java                                             │
│  ├─ generateToken()             (Create JWT)                │
│  ├─ validateToken()             (Verify JWT)                │
│  └─ extractYoutubeId()          (Get user ID)               │
│                                                              │
│  SecurityConfig.java                                        │
│  ├─ CORS configuration          (Extension support)         │
│  ├─ Session management          (Stateless JWT)             │
│  └─ Public/Protected routes     (Access control)            │
│                                                              │
└────────────────┬──────────────────────────────────────────┘
                 │ Verify Google ID Token
                 ▼
        Google OAuth 2.0 API
        (accounts.google.com)
```

## Components Created

### 1. Database Layer

#### User Entity (`model/User.java`)
- **youtubeId**: Unique YouTube/Google ID
- **email**: User email (unique)
- **displayName**: User's display name
- **profileImage**: Avatar URL
- **refreshToken**: Google refresh token for future calls
- **createdAt**: Account creation timestamp
- **lastLogin**: Last login timestamp

```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    youtube_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    profile_image VARCHAR(1024),
    refresh_token TEXT,
    created_at TIMESTAMP NOT NULL,
    last_login TIMESTAMP
);
```

#### Repositories
- `UserRepository`: Query users by youtubeId or email
- `QuestionRepository`: Find questions by videoId
- `QuizResultRepository`: Query quiz results by username or videoId

### 2. Service Layer

#### `GoogleOAuthService.java`
- Verifies Google ID tokens using Google's official library
- Extracts user information from JWT payload
- Handles token validation errors

#### `UserService.java`
- Authenticates users with Google ID token
- Creates new users or updates existing ones
- Generates JWT tokens for subsequent requests

### 3. Configuration Layer

#### `JwtConfig.java`
- Generates JWT tokens with 24-hour expiration
- Validates JWT signatures using HMAC-SHA256
- Extracts user information from tokens

**Token Structure:**
```json
{
  "sub": "youtubeId",
  "email": "user@gmail.com",
  "youtubeId": "youtubeId",
  "iat": 1672531200,
  "exp": 1672617600
}
```

#### `SecurityConfig.java`
- Enables Spring Security with JWT
- Configures CORS for Chrome extension origin
- Allows public access to `/api/auth/login`
- Requires authentication for other endpoints

#### `JwtAuthenticationFilter.java`
- Intercepts requests with Authorization header
- Validates JWT and sets SecurityContext
- Allows stateless authentication

### 4. Controller Layer

#### `AuthController.java`

**POST /api/auth/login**
```json
Request:
{
  "idToken": "eyJhbGc...",
  "accessToken": "ya29...",
  "refreshToken": "1//0gkZs..."
}

Response:
{
  "jwtToken": "eyJhbGciOiJIUzI1NiJ9...",
  "youtubeId": "UCqfxYM...",
  "email": "user@gmail.com",
  "displayName": "John Doe",
  "profileImage": "https://...",
  "expiresIn": 86400
}
```

**GET /api/auth/me** (Requires Authorization header)
```
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...

Response:
{
  "id": 1,
  "youtubeId": "UCqfxYM...",
  "email": "user@gmail.com",
  "displayName": "John Doe",
  "profileImage": "https://...",
  "createdAt": "2026-05-01T14:03:20",
  "lastLogin": "2026-05-06T10:30:45"
}
```

**POST /api/auth/logout**
```
POST /api/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...

Response: 200 OK
```

**POST /api/auth/validate**
```
POST /api/auth/validate
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...

Response: true or false
```

## Flow Diagram

### Login Flow

```
1. User opens extension
   ↓
2. Check for existing JWT in chrome.storage.local
   ├─ If valid: Load dashboard
   └─ If invalid/missing: Show login button
   ↓
3. User clicks "Sign in with Google"
   ↓
4. Chrome Identity API launches OAuth flow
   ├─ User logs into Google account
   ├─ User consents to share profile data
   └─ Authorization code returned
   ↓
5. Extension sends ID token to backend
   POST /api/auth/login
   ↓
6. Backend verifies Google token
   ├─ Valid: Check if user exists
   │ ├─ Yes: Update lastLogin
   │ └─ No: Create new user record
   └─ Invalid: Return 401
   ↓
7. Backend generates JWT token
   ↓
8. Extension stores JWT in chrome.storage.local
   ↓
9. All subsequent requests use Bearer token
```

### Request Flow (Authenticated)

```
Client Request with JWT:
GET /api/videos/summarize?videoId=xxx
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...

↓ (JwtAuthenticationFilter)

Validate JWT signature
Extract youtubeId: UCqfxYM...

↓

Set SecurityContext
principal = youtubeId

↓

Route to VideoController.summarize()

↓

Response sent with user context
```

## Security Features

### 1. Token Security
- **HMAC-SHA256**: Industry-standard JWT signing
- **Expiration**: 24-hour automatic expiration
- **No Refresh**: Users must re-authenticate (simple, secure)

### 2. CORS Protection
```java
Allowed Origins:
- chrome-extension://*
- http://localhost:3000 (future website)
- https://youtubelm.com (production website)
```

### 3. Session Management
- **Stateless**: No server-side sessions
- **Token-based**: All authentication via JWT
- **No cookies**: Prevents CSRF attacks

### 4. Database Security
- **Hashed passwords**: Not applicable (OAuth only)
- **Unique constraints**: youtube_id and email
- **Secure storage**: Refresh tokens in encrypted DB column

### 5. HTTPS Enforcement
```properties
# Production only:
server.servlet.session.cookie.secure=true
server.servlet.session.cookie.http-only=true
server.servlet.session.cookie.same-site=Strict
```

## Configuration Files

### Development (H2)
**File**: `application.properties`
```properties
spring.profiles.active=dev
spring.datasource.url=jdbc:h2:file:./ytlearner-db
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.jpa.hibernate.ddl-auto=update

ytlearner.jwt.secret=dev-secret-key-256-bits
ytlearner.jwt.expiration=86400000

ytlearner.google.client-id=YOUR_DEV_CLIENT_ID.apps.googleusercontent.com
```

### Production (PostgreSQL)
**File**: `application-prod.properties`
```properties
spring.profiles.active=prod
spring.datasource.url=jdbc:postgresql://${DB_HOST}:5432/${DB_NAME}
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.hibernate.ddl-auto=validate

ytlearner.jwt.secret=${JWT_SECRET}  # From environment
ytlearner.google.client-id=${GOOGLE_CLIENT_ID}
```

## Chrome Extension Integration (Frontend)

### Authentication State Management

```javascript
// Initialize OAuth flow
async function initializeOAuth() {
  const token = await chrome.storage.local.get('ytlearner_jwt_token');
  if (token.ytlearner_jwt_token) {
    await validateToken(token.ytlearner_jwt_token);
  } else {
    showLoginUI();
  }
}

// Store JWT after login
chrome.storage.local.set({
  'ytlearner_jwt_token': response.jwtToken,
  'ytlearner_auth_user': response.youtubeId
});

// Send JWT with requests
const response = await fetch('/api/videos/summarize', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Error Handling

### HTTP Status Codes

| Code | Scenario | Action |
|------|----------|--------|
| 200  | Success  | Proceed |
| 400  | Bad request | Retry with correct parameters |
| 401  | Unauthorized | Show login screen |
| 403  | Forbidden | Check permissions |
| 500  | Server error | Show error message, retry later |

### Frontend Error Handling

```javascript
try {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(authRequest)
  });
  
  if (response.status === 401) {
    showToast('Authentication failed. Please try again.');
    showLoginUI();
  } else if (response.ok) {
    const data = await response.json();
    chrome.storage.local.set({'ytlearner_jwt_token': data.jwtToken});
  }
} catch (error) {
  console.error('Login error', error);
  showToast('Network error. Please check your connection.');
}
```

## Testing

### Manual Testing

```bash
# 1. Login endpoint
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"idToken": "google-id-token-here"}'

# 2. Get current user
curl -X GET http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer your-jwt-token"

# 3. Validate token
curl -X POST http://localhost:8080/api/auth/validate \
  -H "Authorization: Bearer your-jwt-token"
```

### Unit Tests (TODO)

```java
@Test
void testValidateToken_ValidToken_ReturnsTrue() {
  String token = jwtConfig.generateToken("user123", "user@gmail.com");
  assertTrue(jwtConfig.validateToken(token));
}

@Test
void testAuthenticateWithGoogle_NewUser_CreatesUserAndReturnsToken() {
  AuthRequest request = new AuthRequest();
  request.setIdToken("valid-google-token");
  
  AuthResponse response = userService.authenticateWithGoogle(request);
  
  assertNotNull(response.getJwtToken());
  assertTrue(userRepository.findByYoutubeId(response.getYoutubeId()).isPresent());
}
```

## Google Cloud Console Setup

### Prerequisites
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable YouTube Data API v3

### Create OAuth 2.0 Credentials

1. **For Chrome Extension**:
   - Application type: Desktop application
   - Redirect URI: `https://{extension-id}.chromiumapp.org/`

2. **For Website** (future):
   - Application type: Web application
   - Authorized origins: `https://youtubelm.com`
   - Redirect URIs: `https://youtubelm.com/auth/callback`

3. Copy credentials to `application.properties`:
```properties
ytlearner.google.client-id=your-client-id.apps.googleusercontent.com
ytlearner.google.client-secret=your-client-secret
```

## Deployment Checklist

- [ ] JWT secret generated and stored in environment
- [ ] Google OAuth credentials obtained
- [ ] PostgreSQL database created
- [ ] CORS origins configured for production domain
- [ ] SSL/HTTPS enforced
- [ ] Logging configured (INFO level for production)
- [ ] Security headers enabled
- [ ] Rate limiting configured (optional)
- [ ] Monitoring and alerting set up
- [ ] Backup strategy in place

## Future Enhancements

1. **Token Refresh**:
   - Implement refresh tokens
   - Auto-renew before expiration

2. **Multi-Device Sync**:
   - Store user preferences server-side
   - Sync across devices

3. **Social Features**:
   - User profiles
   - Follow other learners
   - Share progress

4. **API Rate Limiting**:
   - Per-user quotas
   - Request throttling

5. **Advanced Security**:
   - Two-factor authentication
   - Session management
   - IP whitelisting (optional)

---

**Status**: ✅ Implementation Complete
**Testing**: Pending
**Deployment**: Ready for staging
