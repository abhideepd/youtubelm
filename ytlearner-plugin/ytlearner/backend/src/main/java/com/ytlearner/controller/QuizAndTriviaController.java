package com.ytlearner.controller;

import com.ytlearner.dto.*;
import com.ytlearner.service.AIService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Quiz results + Trivia endpoints.
 */
@Slf4j
@RestController
@RequiredArgsConstructor
public class QuizAndTriviaController {

    private final AIService aiService;
    private final VideoService videoService;

    // username -> list of quiz results
    private final Map<String, List<QuizResultRequest>> quizResults = new ConcurrentHashMap<>();
    // username -> tracked video IDs with titles
    private final Map<String, Map<String, String>> trackedVideos = new ConcurrentHashMap<>();
    // username -> frequencyMinutes
    private final Map<String, Integer> triviaPrefs = new ConcurrentHashMap<>();

    // ─── Quiz Results ──────────────────────────────────────────────────────────

    @PostMapping("/api/quiz/results")
    public ResponseEntity<Void> saveQuizResult(@RequestBody QuizResultRequest request) {
        quizResults.computeIfAbsent(request.getUsername(), k -> new ArrayList<>()).add(request);
        log.debug("Quiz result saved: user={}, video={}, {}/{}", 
                  request.getUsername(), request.getVideoId(), request.getScore(), request.getTotal());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/api/quiz/results/{username}")
    public ResponseEntity<List<QuizResultRequest>> getQuizResults(@PathVariable String username) {
        return ResponseEntity.ok(quizResults.getOrDefault(username, List.of()));
    }

    // ─── Trivia Tracking ───────────────────────────────────────────────────────

    @PostMapping("/api/trivia/track")
    public ResponseEntity<Void> trackVideo(@RequestBody TrackVideoRequest request) {
        trackedVideos.computeIfAbsent(request.getUsername(), k -> new HashMap<>())
                     .put(request.getVideoId(), request.getTitle() != null ? request.getTitle() : request.getVideoId());
        log.debug("Video tracked for trivia: user={}, videoId={}", request.getUsername(), request.getVideoId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/api/trivia/preferences")
    public ResponseEntity<Void> savePreferences(@RequestBody TriviaPreferencesRequest request) {
        triviaPrefs.put(request.getUsername(), request.getFrequencyMinutes());
        log.debug("Trivia prefs saved: user={}, freq={}min", request.getUsername(), request.getFrequencyMinutes());
        return ResponseEntity.ok().build();
    }

    /**
     * POST /api/trivia/generate
     * Generates trivia cards for a set of tracked videos.
     */
    @PostMapping("/api/trivia/generate")
    public ResponseEntity<TriviaGenerateResponse> generateTrivia(@RequestBody TriviaGenerateRequest request) {
        List<String> videoIds = request.getVideoIds();
        if (videoIds == null || videoIds.isEmpty()) {
            return ResponseEntity.ok(TriviaGenerateResponse.builder().triviaCards(List.of()).build());
        }

        int limit = request.getLimit() > 0 ? request.getLimit() : 5;
        List<TriviaCard> allCards = new ArrayList<>();

        // Generate trivia for each tracked video
        for (String videoId : videoIds) {
            if (allCards.size() >= limit) break;

            // Look up video title from our trackedVideos map or fall back to videoId
            String title = trackedVideos.values().stream()
                    .filter(m -> m.containsKey(videoId))
                    .map(m -> m.get(videoId))
                    .findFirst()
                    .orElse(videoId);

            String transcript = videoService.getOrFetchTranscript(videoId);
            int cardsPerVideo = Math.max(1, (limit - allCards.size()) / videoIds.size() + 1);

            List<TriviaCard> cards = aiService.generateTriviaCards(videoId, title, transcript, cardsPerVideo);
            allCards.addAll(cards);
        }

        // Shuffle and trim to limit
        Collections.shuffle(allCards);
        List<TriviaCard> result = allCards.stream().limit(limit).collect(Collectors.toList());

        return ResponseEntity.ok(TriviaGenerateResponse.builder().triviaCards(result).build());
    }

    /**
     * Scheduled: logs a daily reminder (in production, would push to users via WebSocket/FCM)
     */
    @Scheduled(cron = "0 0 9 * * *") // 9 AM daily
    public void scheduledTriviaReminder() {
        log.info("Scheduled trivia reminder fired for {} users", trackedVideos.size());
        // In production: push notifications via FCM or WebSocket to connected clients
    }
}
