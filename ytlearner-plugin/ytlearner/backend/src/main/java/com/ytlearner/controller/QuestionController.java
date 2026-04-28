package com.ytlearner.controller;

import com.ytlearner.dto.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * REST endpoints for community Q&A.
 * Uses in-memory storage for demo — wire up JPA repositories for persistence.
 */
@Slf4j
@RestController
@RequestMapping("/api/questions")
public class QuestionController {

    // In-memory store: videoId -> list of questions
    private final Map<String, List<QuestionResponse>> questionStore = new ConcurrentHashMap<>();
    // questionId -> answers
    private final Map<String, List<AnswerResponse>> answerStore = new ConcurrentHashMap<>();

    /**
     * GET /api/questions/{videoId}
     * Returns all questions for a video with their answers.
     */
    @GetMapping("/{videoId}")
    public ResponseEntity<List<QuestionResponse>> getQuestions(@PathVariable String videoId) {
        List<QuestionResponse> questions = questionStore.getOrDefault(videoId, List.of());
        // Attach answers
        List<QuestionResponse> enriched = questions.stream().map(q -> {
            List<AnswerResponse> answers = answerStore.getOrDefault(q.getId(), List.of());
            return QuestionResponse.builder()
                    .id(q.getId())
                    .videoId(q.getVideoId())
                    .author(q.getAuthor())
                    .text(q.getText())
                    .answers(answers)
                    .createdAt(q.getCreatedAt())
                    .build();
        }).toList();
        return ResponseEntity.ok(enriched);
    }

    /**
     * POST /api/questions
     * Submits a new community question.
     */
    @PostMapping
    public ResponseEntity<QuestionResponse> postQuestion(@RequestBody QuestionRequest request) {
        String id = UUID.randomUUID().toString();
        QuestionResponse question = QuestionResponse.builder()
                .id(id)
                .videoId(request.getVideoId())
                .author(sanitize(request.getAuthor()))
                .text(sanitize(request.getText()))
                .answers(List.of())
                .createdAt(LocalDateTime.now())
                .build();

        questionStore.computeIfAbsent(request.getVideoId(), k -> new ArrayList<>()).add(question);
        log.debug("New question posted for videoId={} by {}", request.getVideoId(), request.getAuthor());
        return ResponseEntity.ok(question);
    }

    /**
     * POST /api/questions/{questionId}/answers
     * Posts an answer to a specific question.
     */
    @PostMapping("/{questionId}/answers")
    public ResponseEntity<AnswerResponse> postAnswer(
            @PathVariable String questionId,
            @RequestBody AnswerRequest request) {
        AnswerResponse answer = AnswerResponse.builder()
                .id(UUID.randomUUID().toString())
                .author(sanitize(request.getAuthor()))
                .text(sanitize(request.getText()))
                .createdAt(LocalDateTime.now())
                .build();

        answerStore.computeIfAbsent(questionId, k -> new ArrayList<>()).add(answer);
        log.debug("Answer posted for questionId={} by {}", questionId, request.getAuthor());
        return ResponseEntity.ok(answer);
    }

    /**
     * DELETE /api/questions/{questionId}
     * Remove a question (only by the author — simplified, no auth).
     */
    @DeleteMapping("/{questionId}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable String questionId,
                                               @RequestParam String author) {
        questionStore.values().forEach(list -> list.removeIf(
                q -> q.getId().equals(questionId) && q.getAuthor().equals(author)));
        answerStore.remove(questionId);
        return ResponseEntity.noContent().build();
    }

    private String sanitize(String input) {
        if (input == null) return "";
        return input.trim().substring(0, Math.min(input.trim().length(), 300));
    }
}
