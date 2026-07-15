package com.example.demo.dto.response;

import com.example.demo.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

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
    private LocalDate dateOfBirth;
    private String ageGroup;

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

    public static AuthResponse of(String token, User user) {
        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .role(user.getRole().name())
                .dateOfBirth(user.getDateOfBirth())
                .ageGroup(user.getAgeGroup() != null ? user.getAgeGroup().name() : null)
                .build();
    }
}
