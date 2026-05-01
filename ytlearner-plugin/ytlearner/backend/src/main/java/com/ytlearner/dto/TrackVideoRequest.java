package com.ytlearner.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrackVideoRequest {
    private String videoId;
    private String username;
    private String title;
}

