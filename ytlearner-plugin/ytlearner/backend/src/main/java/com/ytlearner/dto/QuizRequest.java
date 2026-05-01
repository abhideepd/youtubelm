package com.ytlearner.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizRequest {
    private String videoId;
    private String title;
    private int count;
}

