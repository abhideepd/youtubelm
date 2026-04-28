package com.ytlearner.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// ─── Video Entity ─────────────────────────────────────────────────────────────
@Entity
@Table(name = "videos")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
class VideoEntity {
    @Id
    private String videoId;
    private String title;
    private String channel;
    private String duration;

    @Column(columnDefinition = "TEXT")
    private String cachedSummary;

    @Column(columnDefinition = "TEXT")
    private String cachedTranscript;

    private LocalDateTime summarizedAt;
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}

// ─── Question Entity ──────────────────────────────────────────────────────────
@Entity
@Table(name = "questions")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
class QuestionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String videoId;
    private String author;

    @Column(columnDefinition = "TEXT")
    private String text;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<AnswerEntity> answers = new ArrayList<>();

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}

// ─── Answer Entity ────────────────────────────────────────────────────────────
@Entity
@Table(name = "answers")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
class AnswerEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id")
    private QuestionEntity question;

    private String author;

    @Column(columnDefinition = "TEXT")
    private String text;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}

// ─── User Video Preference (for trivia tracking) ──────────────────────────────
@Entity
@Table(name = "user_video_preferences")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
class UserVideoPreferenceEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String username;
    private String videoId;
    private String videoTitle;
    private LocalDateTime trackedAt;
    private int triviaFrequencyMinutes;

    @PrePersist
    protected void onCreate() {
        if (trackedAt == null) trackedAt = LocalDateTime.now();
        if (triviaFrequencyMinutes == 0) triviaFrequencyMinutes = 1440;
    }
}

// ─── Quiz Result ──────────────────────────────────────────────────────────────
@Entity
@Table(name = "quiz_results")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
class QuizResultEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String username;
    private String videoId;
    private int score;
    private int total;
    private LocalDateTime takenAt;

    @PrePersist
    protected void onCreate() { takenAt = LocalDateTime.now(); }
}
