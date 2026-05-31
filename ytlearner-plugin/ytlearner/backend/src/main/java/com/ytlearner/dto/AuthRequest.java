package com.ytlearner.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthRequest {
    private String idToken;           // Google ID token from Chrome extension
    private String accessToken;       // Google access token
    private String refreshToken;      // Google refresh token (optional)
}
