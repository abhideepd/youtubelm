package com.ytlearner.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnswerResponse {
    private String id;
    private String author;
    private String text;
    private LocalDateTime createdAt;
}

