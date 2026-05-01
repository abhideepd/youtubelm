package com.ytlearner.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TriviaPreferencesRequest {
    private String username;
    private int frequencyMinutes;
}

