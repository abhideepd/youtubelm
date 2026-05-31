package com.ytlearner.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.*;
import com.google.api.client.json.gson.GsonFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.*;

@Slf4j
@Service
public class GoogleOAuthService {

    @Value("${ytlearner.google.client-id}")
    private String googleClientId;

    /**
     * Verify Google ID token and extract YouTube user info
     */
    public Map<String, Object> verifyIdToken(String idToken) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance()
            )
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken payload = verifier.verify(idToken);
            if (payload == null) {
                log.warn("Invalid ID token");
                return null;
            }

            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("youtubeId", payload.getPayload().getSubject()); // Google User IDID
            userInfo.put("email", payload.getPayload().getEmail());
            userInfo.put("displayName", (String) payload.getPayload().get("name"));
            userInfo.put("profileImage", (String) payload.getPayload().get("picture"));

            log.debug("Successfully verified ID token for user: {}", payload.getPayload().getEmail());
            return userInfo;
        } catch (Exception e) {
            log.error("Error verifying ID token", e);
            return null;
        }
    }
}
