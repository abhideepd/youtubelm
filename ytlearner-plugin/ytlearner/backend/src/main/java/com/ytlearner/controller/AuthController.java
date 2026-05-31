package com.ytlearner.controller;

import com.ytlearner.config.JwtConfig;
import com.ytlearner.dto.AuthRequest;
import com.ytlearner.dto.AuthResponse;
import com.ytlearner.model.User;
import com.ytlearner.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = {"chrome-extension://*", "http://localhost:3000"})
public class AuthController {

    private final UserService userService;
    private final JwtConfig jwtConfig;

    /**
     * POST /api/auth/login
     * Authenticate with Google ID token and receive JWT token
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        try {
            AuthResponse response = userService.authenticateWithGoogle(request);
            log.info("User logged in: {}", response.getEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Login failed", e);
            return ResponseEntity.status(401).build();
        }
    }

    /**
     * GET /api/auth/me
     * Get current user info (requires valid JWT token)
     */
    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            if (!jwtConfig.validateToken(token)) {
                log.warn("Invalid or expired token");
                return ResponseEntity.status(401).build();
            }
            String youtubeId = jwtConfig.extractYoutubeId(token);
            User user = userService.getCurrentUser(youtubeId);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            log.error("Error fetching current user", e);
            return ResponseEntity.status(401).build();
        }
    }

    /**
     * POST /api/auth/logout
     * Logout user (token invalidation handled client-side)
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String email = jwtConfig.extractEmail(token);
            log.info("User logged out: {}", email);
            // Token invalidation is handled client-side by removing it
            // In production, you can implement a token blacklist if needed
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error during logout", e);
            return ResponseEntity.status(400).build();
        }
    }

    /**
     * POST /api/auth/validate
     * Validate JWT token without extracting user info
     */
    @PostMapping("/validate")
    public ResponseEntity<Boolean> validateToken(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            boolean isValid = jwtConfig.validateToken(token);
            return ResponseEntity.ok(isValid);
        } catch (Exception e) {
            log.error("Token validation failed", e);
            return ResponseEntity.ok(false);
        }
    }
}
