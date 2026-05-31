package com.ytlearner.service;

import com.ytlearner.config.JwtConfig;
import com.ytlearner.dto.AuthRequest;
import com.ytlearner.dto.AuthResponse;
import com.ytlearner.model.User;
import com.ytlearner.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final GoogleOAuthService googleOAuthService;
    private final JwtConfig jwtConfig;

    public AuthResponse authenticateWithGoogle(AuthRequest request) {
        // Verify Google ID token
        Map<String, Object> googleUser = googleOAuthService.verifyIdToken(request.getIdToken());
        if (googleUser == null) {
            throw new RuntimeException("Invalid Google ID token");
        }

        String youtubeId = (String) googleUser.get("youtubeId");
        String email = (String) googleUser.get("email");
        String displayName = (String) googleUser.get("displayName");
        String profileImage = (String) googleUser.get("profileImage");

        // Find or create user
        User user = userRepository.findByYoutubeId(youtubeId)
                .orElseGet(() -> {
                    User newUser = User.builder()
                            .youtubeId(youtubeId)
                            .email(email)
                            .displayName(displayName)
                            .profileImage(profileImage)
                            .refreshToken(request.getRefreshToken() != null ? request.getRefreshToken() : "")
                            .createdAt(LocalDateTime.now())
                            .build();
                    log.info("New user created: {}", email);
                    return userRepository.save(newUser);
                });

        // Update last login
        user.setLastLogin(LocalDateTime.now());
        if (request.getRefreshToken() != null) {
            user.setRefreshToken(request.getRefreshToken());
        }
        userRepository.save(user);
        log.debug("User logged in: {}", email);

        // Generate JWT token
        String jwtToken = jwtConfig.generateToken(youtubeId, email);

        return AuthResponse.builder()
                .jwtToken(jwtToken)
                .youtubeId(youtubeId)
                .email(email)
                .displayName(displayName)
                .profileImage(profileImage)
                .expiresIn(jwtConfig.getExpirationTime() / 1000) // Convert to seconds
                .build();
    }

    public User getCurrentUser(String youtubeId) {
        return userRepository.findByYoutubeId(youtubeId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
