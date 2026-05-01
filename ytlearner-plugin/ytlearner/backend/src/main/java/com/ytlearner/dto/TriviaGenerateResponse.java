package com.ytlearner.dto;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TriviaGenerateResponse {
    private List<TriviaCard> triviaCards;
}

