package com.example.demo.dto.response;

import com.example.demo.entity.User;
import com.example.demo.util.AgeCalculator;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String role;
    private boolean enabled;
    private LocalDate dateOfBirth;
    private Integer age;
    private String ageGroup;
    private LocalDateTime createdAt;

    public static UserResponse from(User user) {
        Integer calculatedAge = user.getDateOfBirth() != null
                ? AgeCalculator.calculateAge(user.getDateOfBirth())
                : null;

        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .enabled(user.isEnabled())
                .dateOfBirth(user.getDateOfBirth())
                .age(calculatedAge)
                .ageGroup(user.getAgeGroup() != null ? user.getAgeGroup().name() : null)
                .createdAt(user.getCreatedAt())
                .build();
    }
}
