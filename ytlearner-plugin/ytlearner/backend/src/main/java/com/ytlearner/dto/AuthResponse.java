package com.ytlearner.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String jwtToken;          // Your app's JWT token
    private String youtubeId;
    private String email;
    private String displayName;
    private String profileImage;
    private Long expiresIn;           // Token expiry in seconds
}
