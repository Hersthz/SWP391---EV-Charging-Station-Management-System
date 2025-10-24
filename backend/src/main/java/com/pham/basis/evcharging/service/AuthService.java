package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.request.UserCreationRequest;
import com.pham.basis.evcharging.dto.response.UserResponse;
import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.model.Wallet;
import com.pham.basis.evcharging.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserService userService;
    private final VerificationTokenService tokenService;
    private final EmailService emailService;
    private final WalletService walletService;
    private final WalletRepository walletRepository;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public UserResponse register(UserCreationRequest request) {
        User user = userService.createUser(request);
        String token = tokenService.createVerificationToken(user);
        String link = frontendUrl + "/verify?token=" + token;
        emailService.sendVerificationEmail(user.getEmail(), "Verify your email", "Click: " + link);

        return new UserResponse(
                user.getId(), user.getFull_name(), user.getUsername(),
                user.getEmail(), user.getPhone(), user.getRole().getName()
        );
    }

    public ResponseEntity<Map<String, String>> verify(String token) {
        User user = tokenService.validateVerificationToken(token);
        if (user == null)
            return ResponseEntity.status(401).body(Map.of("message", "Invalid or expired token"));
        if (Boolean.TRUE.equals(user.getIs_verified()))
            return ResponseEntity.ok(Map.of("message", "Already verified"));

        user.setIs_verified(true);
        Optional<Wallet> wallet = walletRepository.findByUserId(user.getId());
        if (!wallet.isPresent()) {
            walletService.createWallet(user.getId());
        }

        userService.save(user);
        tokenService.removeTokenByUser(user);
        return ResponseEntity.ok(Map.of("message", "Email verified"));
    }

    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated())
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));

        User user = userService.findByUsername(authentication.getName());
        if (user == null)
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));

        UserResponse resp = new UserResponse(
                user.getId(), user.getFull_name(), user.getUsername(),
                user.getEmail(), user.getPhone(),
                user.getRole() != null ? user.getRole().getName() : null
        );
        return ResponseEntity.ok(resp);
    }
}
