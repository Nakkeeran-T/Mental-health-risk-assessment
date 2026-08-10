package com.example.demo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiCompletionResponse {
    
    private String botMessage;
    private ChatMessageResponse.MentalHealthSignals signals;

}
