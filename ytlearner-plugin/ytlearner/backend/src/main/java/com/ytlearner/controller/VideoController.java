package com.ytlearner.controller;

import com.ytlearner.dto.*;
import com.ytlearner.service.AIService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping(value="/api/videos", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
public class VideoController {

    private final AIService aiService;
    private final VideoService videoService;

    /**
     * POST /api/videos/summarize
     * Summarizes a YouTube video. Caches results to avoid repeated API calls.
     */
    @PostMapping("/summarize")
    public ResponseEntity<SummarizeResponse> summarize(@RequestBody SummarizeRequest request) {
        log.debug("Summarize request for videoId={}", request.getVideoId());

        // Check cache first
        SummarizeResponse cached = videoService.getCachedSummary(request.getVideoId(), request.getLength());
        if (cached != null) {
            log.debug("Returning cached summary for videoId={}", request.getVideoId());
            return ResponseEntity.ok(cached);
        }

        // Fetch transcript from YouTube if not provided
        if (request.getTranscript() == null || request.getTranscript().isBlank()) {
            String transcript = videoService.fetchTranscript(request.getVideoId());
            request.setTranscript(transcript);
        }

        SummarizeResponse response = aiService.summarize(request);
        videoService.saveSummary(request, response);

        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/videos/quiz
     * Generates MCQ quiz questions for a video.
     */
    @PostMapping("/quiz")
    public ResponseEntity<QuizResponse> generateQuiz(@RequestBody QuizRequest request) {
        log.debug("Quiz request for videoId={}, count={}", request.getVideoId(), request.getCount());

        int count = Math.min(Math.max(request.getCount(), 1), 15); // clamp 1-15
        String transcript = videoService.getOrFetchTranscript(request.getVideoId());

        QuizResponse response = aiService.generateQuiz(
                request.getVideoId(),
                request.getTitle(),
                transcript,
                count
        );
        return ResponseEntity.ok(response);
    }
}
