package com.ytlearner.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

// ─── Video / Summary ──────────────────────────────────────────────────────────

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SummarizeRequest {
    private String videoId;
    private String title;
    private String channel;
    private String length; // brief | standard | detailed
    private String transcript; // optional, sent from content script
}

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SummarizeResponse {
    private String videoId;
    private String summary;
    private List<String> keyPoints;
    private boolean cached;
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class QuizRequest {
    private String videoId;
    private String title;
    private int count;
}

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class QuizResponse {
    private String videoId;
    private List<MCQQuestion> questions;
}

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class MCQQuestion {
    private String question;
    private List<String> options;
    private int correctIndex;
    private String explanation;
}

// ─── Quiz Result ──────────────────────────────────────────────────────────────

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class QuizResultRequest {
    private String videoId;
    private String username;
    private int score;
    private int total;
}

// ─── Questions / Q&A ──────────────────────────────────────────────────────────

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class QuestionRequest {
    private String videoId;
    private String author;
    private String text;
}

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AnswerRequest {
    private String author;
    private String text;
}

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class QuestionResponse {
    private String id;
    private String videoId;
    private String author;
    private String text;
    private List<AnswerResponse> answers;
    private LocalDateTime createdAt;
}

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AnswerResponse {
    private String id;
    private String author;
    private String text;
    private LocalDateTime createdAt;
}

// ─── Trivia ───────────────────────────────────────────────────────────────────

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class TrackVideoRequest {
    private String videoId;
    private String username;
    private String title;
}

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class TriviaPreferencesRequest {
    private String username;
    private int frequencyMinutes;
}

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class TriviaGenerateRequest {
    private String username;
    private List<String> videoIds;
    private int limit; // 0 = no limit (defaults to 5)
}

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class TriviaGenerateResponse {
    private List<TriviaCard> triviaCards;
}

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class TriviaCard {
    private String type;    // "note" | "question"
    private String content;
    private String source;  // video title
    private String videoId;
}
