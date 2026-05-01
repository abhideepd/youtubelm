package com.ytlearner.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizResultRequest {
    private String videoId;
    private String username;
    private int score;
    private int total;
}

