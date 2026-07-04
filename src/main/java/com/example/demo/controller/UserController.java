package com.example.demo.controller;

import com.example.demo.dto.response.ApiResponse;
import com.example.demo.dto.response.UserResponse;
import com.example.demo.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Users", description = "User profile management")
public class UserController {

    private final UserService userService;

    /**
     * GET /api/users/me
     *
     * Response JSON:
     * {
     *   "success": true,
     *   "data": {
     *     "id": 1,
     *     "firstName": "John",
     *     "lastName": "Doe",
     *     "email": "john@example.com",
     *     "role": "USER",
     *     "enabled": true,
     *     "createdAt": "2026-07-03T12:00:00"
     *   }
     * }
     */
    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(Authentication authentication) {
        UserResponse response = userService.getUserByEmail(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * PUT /api/users/me
     *
     * Request params: firstName, lastName
     */
    @PutMapping("/me")
    @Operation(summary = "Update current user profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateCurrentUser(
            Authentication authentication,
            @RequestParam(required = false) String firstName,
            @RequestParam(required = false) String lastName
    ) {
        UserResponse currentUser = userService.getUserByEmail(authentication.getName());
        UserResponse updated = userService.updateUser(currentUser.getId(), firstName, lastName);
        return ResponseEntity.ok(ApiResponse.success("Profile updated", updated));
    }
}
