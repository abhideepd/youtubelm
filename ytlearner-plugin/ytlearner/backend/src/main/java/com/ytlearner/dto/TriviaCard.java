package com.ytlearner.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TriviaCard {
    private String type;    // "note" | "question"
    private String content;
    private String source;  // video title
    private String videoId;
}

