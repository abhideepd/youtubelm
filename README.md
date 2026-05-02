# 🎓 YT Learner — YouTube Chrome Extension

> AI-powered learning companion: summarize videos, generate quizzes, engage with community Q&A, and get spaced-repetition trivia notifications.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                 Chrome Extension                     │
│  ┌──────────────┐  ┌────────────┐  ┌─────────────┐  │
│  │  popup.html  │  │ content.js │  │background.js│  │
│  │  (Main UI)   │  │ (YouTube   │  │ (Alarms &   │  │
│  │              │  │  injected) │  │ notifs)     │  │
│  └──────┬───────┘  └─────┬──────┘  └──────┬──────┘  │
└─────────┼────────────────┼────────────────┼──────────┘
          │  REST API      │ chrome.msg     │ chrome.alarms
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────┐
│              Spring Boot Backend (Java 17)           │
│                                                     │
│  /api/videos/summarize  ──▶  AIService              │
│  /api/videos/quiz       ──▶  AIService              │
│  /api/questions         ──▶  QuestionController     │
│  /api/trivia/generate   ──▶  AIService              │
│  /api/trivia/track      ──▶  QuizAndTriviaController│
│                                                     │
│             AIService ──▶ Claude API                │
│                        or OpenAI API                │
└─────────────────────────────────────────────────────┘
```

---

## Features

| Feature | Description |
|---------|-------------|
| **🤖 AI Summarizer** | Summarizes any YouTube video in Brief / Standard / Detailed modes. Extracts key points. Caches results. |
| **📝 MCQ Quiz** | Auto-generates 3–15 multiple choice questions with explanations. Tracks scores. |
| **💬 Community Q&A** | Users post questions; community or creators answer. Per-video threads. |
| **🔔 Spaced Repetition** | Track videos → get daily/weekly trivia notifications via Chrome Alarms. |
| **📌 Video Tracking** | One-click track from banner. Managed list in Trivia tab. |

---

## Quick Start

### 1. Backend Setup

**Prerequisites:** Java 17+, Maven 3.8+

```bash
cd backend
# Set your API key
export ANTHROPIC_API_KEY=sk-ant-...
# OR for OpenAI:
# export OPENAI_API_KEY=sk-...
# and set ytlearner.ai.provider=openai in application.properties

mvn spring-boot:run
# Server starts on http://localhost:8080
# H2 Console at http://localhost:8080/h2-console
```

### 2. Chrome Extension Setup

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer Mode** (top right)
3. Click **Load unpacked**
4. Select the `chrome-extension/` folder

> **Icons:** Generate icons (16×16, 48×48, 128×128) and place them in `chrome-extension/icons/`. Use any icon generator — a simple YouTube play button styled in purple works great.

### 3. Configure the Extension

1. Click the YT Learner extension icon
2. Click ⚙ Settings
3. Set **Backend API URL**: `http://localhost:8080`
4. Set your **Username**
5. Click Save

---

## API Endpoints

### Video / Summary
```
POST /api/videos/summarize
Body: { "videoId": "...", "title": "...", "channel": "...", "length": "standard", "transcript": "..." }
Response: { "summary": "...", "keyPoints": [...] }

POST /api/videos/quiz
Body: { "videoId": "...", "title": "...", "count": 5 }
Response: { "questions": [{ "question": "...", "options": [...], "correctIndex": 0, "explanation": "..." }] }
```

### Community Q&A
```
GET  /api/questions/{videoId}        — List questions with answers
POST /api/questions                  — Post a question
POST /api/questions/{id}/answers     — Post an answer
DELETE /api/questions/{id}?author=.. — Delete a question
```

### Trivia
```
POST /api/trivia/track              — Track a video for trivia
POST /api/trivia/preferences        — Set notification frequency
POST /api/trivia/generate           — Get trivia cards for tracked videos
POST /api/quiz/results              — Save quiz score
```

---

## Project Structure

```
ytlearner/
├── chrome-extension/
│   ├── manifest.json          # MV3 extension manifest
│   ├── popup.html             # Main popup UI
│   ├── css/
│   │   └── popup.css          # Dark editorial design system
│   ├── js/
│   │   ├── popup.js           # UI logic, API calls
│   │   ├── content.js         # YouTube page scraper
│   │   └── background.js      # Service worker, alarms
│   └── icons/                 # 16, 48, 128px icons (add manually)
│
└── backend/
    ├── pom.xml
    └── src/main/
        ├── java/com/ytlearner/
        │   ├── YtLearnerApplication.java
        │   ├── config/
        │   │   └── CorsConfig.java
        │   ├── controller/
        │   │   ├── VideoController.java        # /api/videos/*
        │   │   ├── VideoService.java           # Transcript + cache
        │   │   ├── QuestionController.java     # /api/questions/*
        │   │   └── QuizAndTriviaController.java # /api/quiz + /api/trivia
        │   ├── service/
        │   │   └── AIService.java             # Claude / OpenAI integration
        │   ├── model/
        │   │   └── Entities.java              # JPA entities
        │   └── dto/
        │       └── DTOs.java                  # Request/Response DTOs
        └── resources/
            └── application.properties
```

---

## Configuration

### application.properties key settings

| Property | Description | Default |
|----------|-------------|---------|
| `ytlearner.ai.provider` | `anthropic` or `openai` | `anthropic` |
| `ytlearner.ai.anthropic.api-key` | Your Claude API key | (required) |
| `ytlearner.ai.anthropic.model` | Claude model | `claude-sonnet-4-20250514` |
| `ytlearner.youtube.api-key` | YouTube Data API key (for transcripts) | optional |

---

## Production Deployment

1. **Database:** Switch from H2 to PostgreSQL in `application.properties`
2. **Persistence:** Wire JPA repositories to `QuestionController` and `QuizAndTriviaController`
3. **Auth:** Add Spring Security + JWT for user authentication
4. **Transcript:** Implement YouTube OAuth2 for caption download, or integrate `youtube-transcript` library
5. **Push Notifications:** Replace Chrome Alarms with Firebase Cloud Messaging for server-push trivia
6. **Chrome Web Store:** Package the extension and submit for review

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Extension UI | HTML5, CSS3, Vanilla JS (Manifest V3) |
| Backend | Java 17, Spring Boot 3.2, Spring Data JPA |
| Database | H2 (dev) → PostgreSQL (prod) |
| AI | Anthropic Claude API / OpenAI (configurable) |
| HTTP Client | OkHttp 4 |

---

## Contributing

1. Fork the repo
2. Create a feature branch
3. Submit a PR with a description of your changes

---

*Built with ❤️ for learners*
