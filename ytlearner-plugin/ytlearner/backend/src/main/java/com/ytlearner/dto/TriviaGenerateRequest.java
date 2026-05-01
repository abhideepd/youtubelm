package com.ytlearner.dto;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TriviaGenerateRequest {
    private String username;
    private List<String> videoIds;
    private int limit; // 0 = no limit (defaults to 5)
}

