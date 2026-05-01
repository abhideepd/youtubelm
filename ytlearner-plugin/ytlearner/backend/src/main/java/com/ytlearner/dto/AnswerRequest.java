package com.ytlearner.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnswerRequest {
    private String author;
    private String text;
}

