// OPTIONAL: Backend Enhancement for Tracked Videos Endpoint
// Add this to your QuizAndTriviaController.java

/*
If you want to add a dedicated endpoint to fetch tracked videos, 
add this method to QuizAndTriviaController:
*/

/**
 * GET /api/trivia/tracked/{username}
 * Returns all tracked videos for a user
 */
@GetMapping(value="/api/trivia/tracked/{username}", produces = MediaType.APPLICATION_JSON_VALUE)
public ResponseEntity<TrackedVideosResponse> getTrackedVideos(@PathVariable String username) {
    try {
        Map<String, String> videos = trackedVideos.getOrDefault(username, new HashMap<>());
        List<VideoInfo> videoList = videos.entrySet().stream()
            .map(entry -> VideoInfo.builder()
                .videoId(entry.getKey())
                .title(entry.getValue())
                .channel("Unknown Channel") // You can enhance this by storing channel info
                .build())
            .collect(Collectors.toList());
        
        TrackedVideosResponse response = TrackedVideosResponse.builder()
            .videos(videoList)
            .count(videoList.size())
            .build();
        
        return ResponseEntity.ok(response);
    } catch (Exception e) {
        log.error("Failed to get tracked videos for user: {}", username, e);
        return ResponseEntity.status(500).build();
    }
}

/**
 * DELETE /api/trivia/tracked/{username}/{videoId}
 * Remove a video from tracked list
 */
@DeleteMapping(value="/api/trivia/tracked/{username}/{videoId}")
public ResponseEntity<Void> removeTrackedVideo(
    @PathVariable String username,
    @PathVariable String videoId) {
    try {
        Map<String, String> userVideos = trackedVideos.get(username);
        if (userVideos != null) {
            userVideos.remove(videoId);
            log.debug("Removed tracked video for user: {}, videoId: {}", username, videoId);
        }
        return ResponseEntity.ok().build();
    } catch (Exception e) {
        log.error("Failed to remove tracked video", e);
        return ResponseEntity.status(500).build();
    }
}

// ─── DTOs needed for the above endpoints ─────────────────────────────────────

// Create VideoInfo.java
package com.ytlearner.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VideoInfo {
    private String videoId;
    private String title;
    private String channel;
    private String duration;
}

// Create TrackedVideosResponse.java
package com.ytlearner.dto;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrackedVideosResponse {
    private List<VideoInfo> videos;
    private int count;
}

// ─── Installation Instructions ────────────────────────────────────────────────
/*
1. Copy the VideoInfo.java and TrackedVideosResponse.java DTOs to:
   backend/src/main/java/com/ytlearner/dto/

2. Add the two methods above to:
   backend/src/main/java/com/ytlearner/controller/QuizAndTriviaController.java

3. Add the import statements:
   import com.ytlearner.dto.TrackedVideosResponse;
   import com.ytlearner.dto.VideoInfo;

4. Rebuild your backend:
   mvn clean build
   
   or for Gradle:
   gradle clean build

5. The frontend will automatically use this endpoint if it exists:
   - It tries to fetch from /api/trivia/tracked/{username}
   - Falls back to quiz results if endpoint doesn't exist
   - No code changes needed on frontend!
*/
