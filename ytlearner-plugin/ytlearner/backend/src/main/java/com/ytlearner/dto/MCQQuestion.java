package com.ytlearner.dto;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MCQQuestion {
    private String question;
    private List<String> options;
    private int correctIndex;
    private String explanation;
}

