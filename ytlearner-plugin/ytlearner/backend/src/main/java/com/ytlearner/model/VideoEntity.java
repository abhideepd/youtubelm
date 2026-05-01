package com.ytlearner.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "videos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VideoEntity {
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
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
