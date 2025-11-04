package com.pham.basis.evcharging.service.Impl;

import com.pham.basis.evcharging.dto.request.UserCreationRequest;
import com.pham.basis.evcharging.dto.response.UserResponse;
import com.pham.basis.evcharging.exception.AppException;
import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.repository.WalletRepository;
import com.pham.basis.evcharging.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserService userService;
    private final VerificationTokenService tokenService;
    private final EmailService emailService;
    private final WalletService walletService;
    private final WalletRepository walletRepository;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public UserResponse register(UserCreationRequest request) {
        User user = userService.createUser(request);
        String token = tokenService.createVerificationToken(user);
        String link = frontendUrl + "/verify?token=" + token;
        emailService.sendVerificationEmail(user.getEmail(), "Verify your email", link);

        return UserResponse.builder()
                .email(user.getEmail())
                .fullName(user.getFullName())
                .id(user.getId())
                .username(user.getUsername())
                .phone(user.getPhone())
                .roleName(user.getRole() != null ? user.getRole().getName() : null)
                .build();
    }

    @Override
    public ResponseEntity<Map<String, String>> verify(String token) {
        User user = tokenService.validateVerificationToken(token);
        if (user == null)
            return ResponseEntity.status(401).body(Map.of("message", "Invalid or expired token"));
        if (Boolean.TRUE.equals(user.getIsVerified()))
            return ResponseEntity.ok(Map.of("message", "Already verified"));

        user.setIsVerified(true);

        walletRepository.findByUserId(user.getId()).orElseGet(() -> {
            walletService.createWallet(user.getId());
            return null;
        });
        userService.save(user);
        tokenService.removeTokenByUser(user);
        return ResponseEntity.ok(Map.of("message", "Email verified"));
    }

    @Override
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AppException.UnauthorizedException("Not authenticated");
        }

        User user = userService.findByUsername(authentication.getName());
        if (user == null) {
            throw new AppException.NotFoundException("User not found");
        }

        UserResponse resp = UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .roleName(user.getRole() != null ? user.getRole().getName() : null)
                .isVerified(user.getIsVerified())
                .email(user.getEmail())
                .dateOfBirth(user.getDateOfBirth())
                .build();
        return ResponseEntity.ok(resp);
    }
}
