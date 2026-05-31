package com.ytlearner.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String youtubeId;        // YouTube channel ID

    @Column(unique = true, nullable = false)
    private String email;            // YouTube email

    private String displayName;
    private String profileImage;

    @Column(nullable = false)
    private String refreshToken;     // Stored securely for token refresh

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime lastLogin;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
