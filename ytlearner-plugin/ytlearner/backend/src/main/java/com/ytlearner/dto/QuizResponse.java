package com.ytlearner.dto;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizResponse {
    private String videoId;
    private List<MCQQuestion> questions;
}

