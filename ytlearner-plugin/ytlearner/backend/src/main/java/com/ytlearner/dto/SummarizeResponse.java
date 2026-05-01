package com.ytlearner.dto;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SummarizeResponse {
    private String videoId;
    private String summary;
    private List<String> keyPoints;
    private boolean cached;
}

