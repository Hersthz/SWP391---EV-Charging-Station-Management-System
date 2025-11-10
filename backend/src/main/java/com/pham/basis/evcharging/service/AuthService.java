package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.request.UserCreationRequest;
import com.pham.basis.evcharging.dto.response.UserResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.Map;

public interface AuthService {
    UserResponse register(UserCreationRequest request);

    ResponseEntity<Map<String, String>> verify(String token);

    ResponseEntity<?> getCurrentUser(Authentication authentication);

    void forgotPassword(String email);
    void resetPassword(String token, String newPassword);
}
