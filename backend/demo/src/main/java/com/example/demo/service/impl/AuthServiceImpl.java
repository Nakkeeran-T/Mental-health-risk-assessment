package com.example.demo.service.impl;

import com.example.demo.dto.request.LoginRequest;
import com.example.demo.dto.request.RegisterRequest;
import com.example.demo.dto.response.AuthResponse;
import com.example.demo.entity.User;
import com.example.demo.enums.AgeGroup;
import com.example.demo.enums.Role;
import com.example.demo.exception.BadRequestException;
import com.example.demo.exception.EmailAlreadyExistsException;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtils;
import com.example.demo.service.AuthService;
import com.example.demo.util.AgeCalculator;
import com.example.demo.util.AgeGroupUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException(request.getEmail());
        }

        int age = AgeCalculator.calculateAge(request.getDateOfBirth());
        AgeGroup ageGroup;
        try {
            ageGroup = AgeGroupUtils.determineAgeGroup(age);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException(ex.getMessage());
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .dateOfBirth(request.getDateOfBirth())
                .ageGroup(ageGroup)
                .role(Role.USER)
                .enabled(true)
                .build();

        User savedUser = userRepository.save(user);
        String token = jwtUtils.generateToken(savedUser);

        return AuthResponse.of(token, savedUser);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = (User) authentication.getPrincipal();
        String token = jwtUtils.generateToken(user);

        return AuthResponse.of(token, user);
    }
}
