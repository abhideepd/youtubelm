package com.ytlearner.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.ytlearner.dto.*;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class AIService {

    @Value("${ytlearner.ai.provider:anthropic}")
    private String provider;

    @Value("${ytlearner.ai.anthropic.api-key:}")
    private String anthropicApiKey;

    @Value("${ytlearner.ai.anthropic.model:claude-sonnet-4-20250514}")
    private String anthropicModel;

    @Value("${ytlearner.ai.anthropic.base-url:https://api.anthropic.com/v1}")
    private String anthropicBaseUrl;

    @Value("${ytlearner.ai.openai.api-key:}")
    private String openaiApiKey;

    @Value("${ytlearner.ai.openai.model:gpt-4o-mini}")
    private String openaiModel;

    @Value("${ytlearner.ai.openai.base-url:https://api.openai.com/v1}")
    private String openaiBaseUrl;

    private final OkHttpClient httpClient = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .build();

    private final ObjectMapper mapper = new ObjectMapper();

    // ─── Summarize ────────────────────────────────────────────────────────────
    public SummarizeResponse summarize(SummarizeRequest request) {
        String lengthInstruction = switch (request.getLength() != null ? request.getLength() : "standard") {
            case "brief"    -> "Provide a brief 2-3 sentence summary.";
            case "detailed" -> "Provide a comprehensive detailed summary covering all major points.";
            default         -> "Provide a clear standard summary in 4-6 sentences.";
        };

        String prompt = String.format("""
            You are a learning assistant. Summarize the YouTube video below.
            
            Video Title: %s
            Channel: %s
            %s
            
            %s
            
            Respond ONLY with valid JSON in this exact format:
            {
              "summary": "...",
              "keyPoints": ["point 1", "point 2", "point 3", "point 4", "point 5"]
            }
            
            Do not include markdown fences or any text outside the JSON.
            """,
            request.getTitle(),
            request.getChannel(),
            request.getTranscript() != null
                ? "Transcript:\n" + truncate(request.getTranscript(), 8000)
                : "(No transcript available — use the title and general knowledge about this video)",
            lengthInstruction
        );

        String rawJson = callAI(prompt);
        try {
            JsonNode node = mapper.readTree(cleanJson(rawJson));
            List<String> keyPoints = new ArrayList<>();
            node.path("keyPoints").forEach(n -> keyPoints.add(n.asText()));
            return SummarizeResponse.builder()
                    .videoId(request.getVideoId())
                    .summary(node.path("summary").asText())
                    .keyPoints(keyPoints)
                    .cached(false)
                    .build();
        } catch (Exception e) {
            log.error("Failed to parse summary JSON", e);
            return SummarizeResponse.builder()
                    .videoId(request.getVideoId())
                    .summary(rawJson)
                    .keyPoints(List.of())
                    .cached(false)
                    .build();
        }
    }

    // ─── Generate MCQ Quiz ────────────────────────────────────────────────────
    public QuizResponse generateQuiz(String videoId, String title, String transcript, int count) {
        String prompt = String.format("""
            You are a quiz creator. Generate exactly %d multiple-choice questions for this YouTube video.
            
            Video Title: %s
            %s
            
            Rules:
            - Each question must have exactly 4 options (A, B, C, D)
            - Vary difficulty (easy, medium, hard)
            - Include a brief explanation for the correct answer
            - Questions must test genuine understanding, not trivia
            
            Respond ONLY with valid JSON:
            {
              "questions": [
                {
                  "question": "...",
                  "options": ["option A", "option B", "option C", "option D"],
                  "correctIndex": 0,
                  "explanation": "..."
                }
              ]
            }
            
            Do not include markdown fences or any text outside the JSON.
            """,
            count,
            title,
            transcript != null
                ? "Transcript:\n" + truncate(transcript, 6000)
                : "(Use your knowledge about the topic: " + title + ")"
        );

        String rawJson = callAI(prompt);
        try {
            JsonNode node = mapper.readTree(cleanJson(rawJson));
            List<MCQQuestion> questions = new ArrayList<>();
            node.path("questions").forEach(q -> {
                List<String> options = new ArrayList<>();
                q.path("options").forEach(o -> options.add(o.asText()));
                questions.add(MCQQuestion.builder()
                        .question(q.path("question").asText())
                        .options(options)
                        .correctIndex(q.path("correctIndex").asInt(0))
                        .explanation(q.path("explanation").asText())
                        .build());
            });
            return QuizResponse.builder().videoId(videoId).questions(questions).build();
        } catch (Exception e) {
            log.error("Failed to parse quiz JSON", e);
            return QuizResponse.builder().videoId(videoId).questions(List.of()).build();
        }
    }

    // ─── Generate Trivia Cards ────────────────────────────────────────────────
    public List<TriviaCard> generateTriviaCards(String videoId, String videoTitle,
                                                 String transcript, int count) {
        String prompt = String.format("""
            Generate %d spaced-repetition trivia cards for this YouTube video.
            Mix between short factual notes and recall questions to reinforce memory.
            
            Video: %s
            %s
            
            Respond ONLY with valid JSON:
            {
              "cards": [
                { "type": "note", "content": "Key fact or insight from the video" },
                { "type": "question", "content": "What is X? Answer: Y" }
              ]
            }
            
            Do not include markdown fences or any text outside the JSON.
            """,
            count,
            videoTitle,
            transcript != null
                ? "Transcript:\n" + truncate(transcript, 5000)
                : "(Use topic knowledge for: " + videoTitle + ")"
        );

        String rawJson = callAI(prompt);
        try {
            JsonNode node = mapper.readTree(cleanJson(rawJson));
            List<TriviaCard> cards = new ArrayList<>();
            node.path("cards").forEach(c -> cards.add(TriviaCard.builder()
                    .type(c.path("type").asText("note"))
                    .content(c.path("content").asText())
                    .source(videoTitle)
                    .videoId(videoId)
                    .build()));
            return cards;
        } catch (Exception e) {
            log.error("Failed to parse trivia JSON", e);
            return List.of();
        }
    }

    // ─── Core AI call (Anthropic or OpenAI) ──────────────────────────────────
    private String callAI(String prompt) {
        return "anthropic".equalsIgnoreCase(provider)
                ? callAnthropic(prompt)
                : callOpenAI(prompt);
    }

    private String callAnthropic(String prompt) {
        try {
            ObjectNode body = mapper.createObjectNode();
            body.put("model", anthropicModel);
            body.put("max_tokens", 2048);
            ArrayNode messages = body.putArray("messages");
            ObjectNode msg = messages.addObject();
            msg.put("role", "user");
            msg.put("content", prompt);

            Request req = new Request.Builder()
                    .url(anthropicBaseUrl + "/messages")
                    .post(RequestBody.create(
                            mapper.writeValueAsBytes(body),
                            MediaType.get("application/json")))
                    .addHeader("x-api-key", anthropicApiKey)
                    .addHeader("anthropic-version", "2023-06-01")
                    .addHeader("Content-Type", "application/json")
                    .build();

            try (Response resp = httpClient.newCall(req).execute()) {
                String json = resp.body().string();
                JsonNode root = mapper.readTree(json);
                return root.path("content").get(0).path("text").asText();
            }
        } catch (Exception e) {
            log.error("Anthropic API call failed", e);
            return "{}";
        }
    }

    private String callOpenAI(String prompt) {
        try {
            ObjectNode body = mapper.createObjectNode();
            body.put("model", openaiModel);
            body.put("max_tokens", 2048);
            ArrayNode messages = body.putArray("messages");
            ObjectNode msg = messages.addObject();
            msg.put("role", "user");
            msg.put("content", prompt);

            Request req = new Request.Builder()
                    .url(openaiBaseUrl + "/chat/completions")
                    .post(RequestBody.create(
                            mapper.writeValueAsBytes(body),
                            MediaType.get("application/json")))
                    .addHeader("Authorization", "Bearer " + openaiApiKey)
                    .addHeader("Content-Type", "application/json")
                    .build();

            try (Response resp = httpClient.newCall(req).execute()) {
                String json = resp.body().string();
                JsonNode root = mapper.readTree(json);
                return root.path("choices").get(0).path("message").path("content").asText();
            }
        } catch (Exception e) {
            log.error("OpenAI API call failed", e);
            return "{}";
        }
    }

    // ─── Utilities ────────────────────────────────────────────────────────────
    private String truncate(String text, int maxChars) {
        if (text == null) return "";
        return text.length() > maxChars ? text.substring(0, maxChars) + "…" : text;
    }

    private String cleanJson(String raw) {
        if (raw == null) return "{}";
        raw = raw.trim();
        if (raw.startsWith("```")) {
            raw = raw.replaceAll("^```(json)?\\s*", "").replaceAll("```\\s*$", "").trim();
        }
        return raw;
    }
}
