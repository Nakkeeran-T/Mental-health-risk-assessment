package com.example.demo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String token;
    private String type;
    private Long userId;
    private String email;
    private String firstName;
    private String role;

    public static AuthResponse of(String token, Long userId, String email, String firstName, String role) {
        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .userId(userId)
                .email(email)
                .firstName(firstName)
                .role(role)
                .build();
    }
}
