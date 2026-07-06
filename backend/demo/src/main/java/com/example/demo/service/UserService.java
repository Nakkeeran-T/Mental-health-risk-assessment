package com.example.demo.service;

import com.example.demo.dto.response.UserResponse;
import com.example.demo.entity.User;

import java.util.List;

public interface UserService {

    UserResponse getUserById(Long id);

    UserResponse getUserByEmail(String email);

    UserResponse updateUser(Long id, String firstName, String lastName);

    List<UserResponse> getAllUsers();

    User getCurrentUser(String email);
}
