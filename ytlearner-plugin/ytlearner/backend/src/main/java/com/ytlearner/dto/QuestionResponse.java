package com.ytlearner.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionResponse {
    private String id;
    private String videoId;
    private String author;
    private String text;
    private List<AnswerResponse> answers;
    private LocalDateTime createdAt;
}

