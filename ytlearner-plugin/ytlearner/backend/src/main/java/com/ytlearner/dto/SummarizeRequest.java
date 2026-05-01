package com.ytlearner.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SummarizeRequest {
    private String videoId;
    private String title;
    private String channel;
    private String length; // brief | standard | detailed
    private String transcript; // optional, sent from content script
}

