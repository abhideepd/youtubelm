package com.ytlearner.controller;

import com.ytlearner.dto.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Handles video metadata, transcript fetching, and summary caching.
 * In-memory cache for demo — replace with DB persistence via VideoRepository.
 */
@Slf4j
@Service
public class VideoService {

    @Value("${ytlearner.youtube.api-key:}")
    private String youtubeApiKey;

    // In-memory cache: videoId -> length -> SummarizeResponse
    private final Map<String, Map<String, SummarizeResponse>> summaryCache = new ConcurrentHashMap<>();
    // transcript cache
    private final Map<String, String> transcriptCache = new ConcurrentHashMap<>();

    private final RestTemplate restTemplate = new RestTemplate();

    public SummarizeResponse getCachedSummary(String videoId, String length) {
        if (videoId == null) return null;
        String key = length != null ? length : "standard";
        return summaryCache.getOrDefault(videoId, Map.of()).get(key);
    }

    public void saveSummary(SummarizeRequest request, SummarizeResponse response) {
        if (request.getVideoId() == null) return;
        String key = request.getLength() != null ? request.getLength() : "standard";
        summaryCache.computeIfAbsent(request.getVideoId(), k -> new HashMap<>())
                    .put(key, response);
        log.debug("Cached summary for videoId={}", request.getVideoId());
    }

    public String getOrFetchTranscript(String videoId) {
        if (transcriptCache.containsKey(videoId)) return transcriptCache.get(videoId);
        String transcript = fetchTranscript(videoId);
        if (transcript != null) transcriptCache.put(videoId, transcript);
        return transcript;
    }

    /**
     * Fetches YouTube transcript via YouTube Data API captions endpoint.
     * Requires a valid YouTube Data API key.
     */
    public String fetchTranscript(String videoId) {
        if (videoId == null || youtubeApiKey.isBlank()) {
            log.warn("No YouTube API key configured — transcript unavailable for videoId={}", videoId);
            return null;
        }
        try {
            // Step 1: List caption tracks
            String captionsUrl = String.format(
                "https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=%s&key=%s",
                videoId, youtubeApiKey);
            var captionsResp = restTemplate.getForObject(captionsUrl, Map.class);
            // Step 2: Download the caption track (requires OAuth for download; skip here)
            // For production, implement OAuth2 flow or use a transcript scraper library.
            log.info("Caption tracks found for videoId={} (download requires OAuth)", videoId);
            return null;
        } catch (Exception e) {
            log.warn("Transcript fetch failed for videoId={}: {}", videoId, e.getMessage());
            return null;
        }
    }
}
