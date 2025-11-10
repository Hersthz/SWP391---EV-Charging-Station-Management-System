package com.pham.basis.evcharging.service.Impl;

import com.pham.basis.evcharging.dto.request.UserCreationRequest;
import com.pham.basis.evcharging.dto.response.UserResponse;
import com.pham.basis.evcharging.exception.AppException;
import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.model.VerificationToken;
import com.pham.basis.evcharging.repository.UserRepository;
import com.pham.basis.evcharging.repository.WalletRepository;
import com.pham.basis.evcharging.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserService userService;
    private final UserRepository userRepository;
    private final VerificationTokenService tokenService;
    private final EmailService emailService;
    private final WalletService walletService;
    private final WalletRepository walletRepository;
    private final VerificationTokenService verificationTokenService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public static final String EMAIL_VERIFICATION_TEMPLATE = "email-verification";
    public static final String EMAIL_RESET_PASSWORD_TEMPLATE = "email-reset-password";

    @Override
    public UserResponse register(UserCreationRequest request) {
        User user = userService.createUser(request);
        String token = tokenService.createVerificationToken(user, "REGISTER");
        String link = frontendUrl + "/verify?token=" + token;
        emailService.sendVerificationEmail(user.getEmail(), "Verify your email", link,EMAIL_VERIFICATION_TEMPLATE );

        return UserResponse.builder()
                .email(user.getEmail())
                .fullName(user.getFullName())
                .id(user.getId())
                .username(user.getUsername())
                .phone(user.getPhone())
                .roleName(user.getRole() != null ? user.getRole().getName() : null)
                .url(null)
                .build();
    }

    @Override
    public ResponseEntity<Map<String, String>> verify(String token) {
        User user = tokenService.validateVerificationToken(token, "REGISTER");
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
                .url(user.getUrl())
                .build();
        return ResponseEntity.ok(resp);
    }

    @Override
    public void forgotPassword(String email) {
        User user = userRepository.findByEmailOption(email)
                .orElseThrow(() -> new AppException.NotFoundException("Email not found"));

        String token = verificationTokenService.createVerificationToken(user, "RESET_PASSWORD");

        String resetLink = frontendUrl + "/reset-password?token=" + token;

        emailService.sendVerificationEmail(
                user.getEmail(),
                "Reset your password",
                resetLink,
                EMAIL_RESET_PASSWORD_TEMPLATE
        );
    }

    @Override
    public void resetPassword(String token, String newPassword) {
        User user = verificationTokenService.validateVerificationToken(token, "RESET_PASSWORD");

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        verificationTokenService.removeTokenByUser(user);
    }
}
