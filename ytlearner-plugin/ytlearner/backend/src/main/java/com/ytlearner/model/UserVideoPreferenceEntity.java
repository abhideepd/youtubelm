package com.ytlearner.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_video_preferences")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserVideoPreferenceEntity {
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
        if (trackedAt == null) {
            trackedAt = LocalDateTime.now();
        }
        if (triviaFrequencyMinutes == 0) {
            triviaFrequencyMinutes = 1440;
        }
    }
}
