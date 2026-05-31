# YT Learner - API Testing Guide

Use this guide to test the frontend/backend integration with Postman, curl, or your browser.

## 🔐 Authentication Flow

### 1. Login with Google ID Token

**Request:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "YOUR_GOOGLE_ID_TOKEN_HERE"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "email": "user@gmail.com",
  "displayName": "John Doe"
}
```

*Note: Get idToken from Google OAuth flow in frontend*

### 2. Get Current User

**Request:**
```bash
curl -X GET http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Response:**
```json
{
  "id": 1,
  "youtubeId": "UC...",
  "email": "user@gmail.com",
  "displayName": "John Doe",
  "profileImage": "https://...",
  "createdAt": "2024-01-15T10:30:00",
  "lastLogin": "2024-01-20T15:45:00"
}
```

### 3. Logout

**Request:**
```bash
curl -X POST http://localhost:8080/api/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Response:**
```
204 No Content
```

---

## 📺 Videos & Quizzes

### 1. Track a Video

**Request:**
```bash
curl -X POST http://localhost:8080/api/trivia/track \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "videoId": "dQw4w9WgXcQ",
    "title": "Rick Astley - Never Gonna Give You Up",
    "channel": "Rick Astley"
  }'
```

**Response:**
```
200 OK
```

### 2. Get Tracked Videos

**Request:**
```bash
curl -X GET "http://localhost:8080/api/trivia/tracked/john_doe"
```

**Response:**
```json
{
  "videos": [
    {
      "videoId": "dQw4w9WgXcQ",
      "title": "Rick Astley - Never Gonna Give You Up",
      "channel": "Rick Astley",
      "duration": "3:32"
    },
    {
      "videoId": "9bZkp7q19f0",
      "title": "PSY - GANGNAM STYLE",
      "channel": "officialpsy",
      "duration": "4:13"
    }
  ],
  "count": 2
}
```

### 3. Save Quiz Result

**Request:**
```bash
curl -X POST http://localhost:8080/api/quiz/results \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "videoId": "dQw4w9WgXcQ",
    "videoTitle": "Rick Astley - Never Gonna Give You Up",
    "score": 4,
    "total": 5,
    "questions": [
      {
        "question": "What is the main theme?",
        "answer": "Never giving up"
      }
    ]
  }'
```

**Response:**
```
200 OK
```

### 4. Get Quiz Results

**Request:**
```bash
curl -X GET "http://localhost:8080/api/quiz/results/john_doe"
```

**Response:**
```json
[
  {
    "username": "john_doe",
    "videoId": "dQw4w9WgXcQ",
    "videoTitle": "Rick Astley - Never Gonna Give You Up",
    "score": 4,
    "total": 5,
    "percentage": 80.0,
    "timestamp": "2024-01-20T15:45:30"
  }
]
```

### 5. Save Trivia Preferences

**Request:**
```bash
curl -X POST http://localhost:8080/api/trivia/preferences \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "frequencyMinutes": 1440
  }'
```

**Response:**
```
200 OK
```

### 6. Generate Trivia

**Request:**
```bash
curl -X POST http://localhost:8080/api/trivia/generate \
  -H "Content-Type: application/json" \
  -d '{
    "videoIds": ["dQw4w9WgXcQ", "9bZkp7q19f0"],
    "limit": 5
  }'
```

**Response:**
```json
{
  "triviaCards": [
    {
      "videoId": "dQw4w9WgXcQ",
      "videoTitle": "Rick Astley - Never Gonna Give You Up",
      "question": "What is the name of this song?",
      "options": ["Never Gonna Give You Up", "Always Gonna Love You", "Totally New Song"],
      "correctIndex": 0,
      "explanation": "This is the famous Never Gonna Give You Up by Rick Astley"
    }
  ]
}
```

---

## 📝 Video Summaries & Quizzes

### 1. Summarize Video

**Request:**
```bash
curl -X POST http://localhost:8080/api/videos/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "dQw4w9WgXcQ",
    "title": "Rick Astley - Never Gonna Give You Up",
    "channel": "Rick Astley",
    "length": "standard",
    "transcript": "Never gonna give you up, never gonna let you down..."
  }'
```

**Response:**
```json
{
  "summary": "This is a famous 1987 music video by Rick Astley...",
  "keyPoints": [
    "Classic 1980s music video",
    "Famous internet meme (Rickroll)",
    "Won MTV Video Music Award"
  ]
}
```

### 2. Generate Quiz

**Request:**
```bash
curl -X POST http://localhost:8080/api/videos/quiz \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "dQw4w9WgXcQ",
    "title": "Rick Astley - Never Gonna Give You Up",
    "count": 5
  }'
```

**Response:**
```json
{
  "questions": [
    {
      "question": "In what year was this song released?",
      "options": ["1985", "1987", "1989", "1991"],
      "correctIndex": 1,
      "explanation": "Never Gonna Give You Up was released in 1987"
    },
    {
      "question": "Who is the artist?",
      "options": ["Phil Collins", "Rick Astley", "George Michael", "Robert Smith"],
      "correctIndex": 1,
      "explanation": "Rick Astley is the original artist"
    }
  ]
}
```

---

## ❓ Community Q&A

### 1. Get Questions for Video

**Request:**
```bash
curl -X GET "http://localhost:8080/api/questions/dQw4w9WgXcQ"
```

**Response:**
```json
[
  {
    "id": 1,
    "videoId": "dQw4w9WgXcQ",
    "question": "What year was this released?",
    "questioner": "john_doe",
    "timestamp": "2024-01-20T10:00:00",
    "answers": []
  }
]
```

### 2. Post Question

**Request:**
```bash
curl -X POST http://localhost:8080/api/questions \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "dQw4w9WgXcQ",
    "question": "What is the name of the band?",
    "questioner": "john_doe"
  }'
```

**Response:**
```json
{
  "id": 2,
  "videoId": "dQw4w9WgXcQ",
  "question": "What is the name of the band?",
  "questioner": "john_doe",
  "timestamp": "2024-01-20T15:45:30"
}
```

### 3. Post Answer

**Request:**
```bash
curl -X POST http://localhost:8080/api/questions/2/answers \
  -H "Content-Type: application/json" \
  -d '{
    "answer": "Rick Astley",
    "answerer": "jane_doe"
  }'
```

**Response:**
```
200 OK
```

---

## 🧪 Testing with Postman

### Setup:
1. Download Postman
2. Create new Collection: "YT Learner"
3. Create Environment with variables:
   - `base_url` = `http://localhost:8080`
   - `jwt_token` = (paste JWT from login)
   - `username` = `john_doe`

### Create Requests:

**1. Login**
- Method: POST
- URL: `{{base_url}}/api/auth/login`
- Body (JSON):
  ```json
  {
    "idToken": "YOUR_GOOGLE_TOKEN"
  }
  ```
- After response, save token to environment:
  ```javascript
  var jsonData = pm.response.json();
  pm.environment.set("jwt_token", jsonData.token);
  ```

**2. Get Current User**
- Method: GET
- URL: `{{base_url}}/api/auth/me`
- Headers: `Authorization: Bearer {{jwt_token}}`

**3. Track Video**
- Method: POST
- URL: `{{base_url}}/api/trivia/track`
- Headers: `Authorization: Bearer {{jwt_token}}`
- Body (JSON):
  ```json
  {
    "username": "{{username}}",
    "videoId": "dQw4w9WgXcQ",
    "title": "Rick Astley - Never Gonna Give You Up",
    "channel": "Rick Astley"
  }
  ```

**4. Get Tracked Videos**
- Method: GET
- URL: `{{base_url}}/api/trivia/tracked/{{username}}`

---

## 💡 Testing Tips

### Using Browser Console

```javascript
// Get JWT Token
const token = localStorage.getItem('ytlearner_jwt_token');
console.log('JWT Token:', token);

// Get User Data
const user = JSON.parse(localStorage.getItem('ytlearner_current_user'));
console.log('User:', user);

// Make API Request
fetch('http://localhost:8080/api/quiz/results/john_doe', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(r => r.json())
.then(data => console.log('Quiz Results:', data));
```

### Using curl with Saved Token

```bash
# Save token to variable
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"idToken":"YOUR_TOKEN"}' | jq -r '.token')

# Use token in requests
curl -X GET "http://localhost:8080/api/auth/me" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔍 Common Test Scenarios

### Scenario 1: Complete User Journey

```bash
# 1. Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"idToken":"TOKEN"}'
# Save token

# 2. Get user info
curl -X GET http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer TOKEN"

# 3. Track a video
curl -X POST http://localhost:8080/api/trivia/track \
  -H "Content-Type: application/json" \
  -d '{"username":"john","videoId":"dQw4w9WgXcQ","title":"Never Gonna Give You Up","channel":"Rick Astley"}'

# 4. View tracked videos
curl -X GET "http://localhost:8080/api/trivia/tracked/john"

# 5. Save quiz result
curl -X POST http://localhost:8080/api/quiz/results \
  -H "Content-Type: application/json" \
  -d '{"username":"john","videoId":"dQw4w9WgXcQ","score":4,"total":5}'

# 6. Get quiz results
curl -X GET "http://localhost:8080/api/quiz/results/john"
```

### Scenario 2: Multiple Videos

```bash
# Track 3 videos
for vid in dQw4w9WgXcQ 9bZkp7q19f0 xfr64zoBTAU; do
  curl -X POST http://localhost:8080/api/trivia/track \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"john\",\"videoId\":\"$vid\"}"
done

# View all
curl -X GET "http://localhost:8080/api/trivia/tracked/john"
```

---

## 📊 Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

---

## 🐛 Debugging

### Check Backend Logs
```bash
# Maven
mvn spring-boot:run

# Gradle
gradle bootRun

# Docker (if applicable)
docker logs container_id
```

### Monitor Network Requests
1. Open DevTools (F12)
2. Go to Network tab
3. Perform action in app
4. View request/response details

### Check Response Headers
Look for these important headers in responses:
- `Authorization` - JWT token (should be present in responses)
- `Content-Type` - Should be `application/json`
- `Access-Control-Allow-Origin` - CORS origin

---

## 📚 Additional Resources

- [REST API Best Practices](https://restfulapi.net/)
- [JWT Handbook](https://auth0.com/resources/ebooks/jwt-handbook)
- [HTTP Status Codes](https://httpwg.org/specs/rfc7231.html#status.codes)
- [curl Documentation](https://curl.se/docs/)
- [Postman Documentation](https://learning.postman.com/)

---

Happy testing! 🚀
