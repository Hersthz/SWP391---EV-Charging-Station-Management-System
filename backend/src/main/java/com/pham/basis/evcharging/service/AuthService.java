package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.request.LoginRequest;
import com.pham.basis.evcharging.dto.request.UserCreationRequest;
import com.pham.basis.evcharging.dto.response.ErrorResponse;
import com.pham.basis.evcharging.dto.response.LoginResponse;
import com.pham.basis.evcharging.dto.response.UserResponse;
import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.security.JwtUtil;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class AuthService {
    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final VerificationTokenService tokenService;
    private final EmailService emailService;
    private final Environment env;

    @Value("${jwt.expiration:86400000}")
    private long jwtExpiration;

    public AuthService(UserService userService, JwtUtil jwtUtil, VerificationTokenService tokenService,
                       EmailService emailService, Environment env) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
        this.tokenService = tokenService;
        this.emailService = emailService;
        this.env = env;
    }

    public UserResponse register(UserCreationRequest request) {
        User user = userService.createUser(request);
        String token = tokenService.createVerificationToken(user);
        String frontendUrl = env.getProperty("app.frontend-url", "http://localhost:5173");
        String link = frontendUrl + "/verify?token=" + token;

        emailService.sendVerificationEmail(user.getEmail(), "Verify your email", "Click here: " + link);

        return new UserResponse(
                user.getId(), user.getFull_name(), user.getUsername(),
                user.getEmail(), user.getPhone(), user.getRole().getName()
        );
    }

    public ResponseEntity<?> login(LoginRequest request, HttpServletResponse response) {
        try {
            User user = userService.login(request.getUsername(), request.getPassword());
            if (!Boolean.TRUE.equals(user.getIs_verified())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Email not verified! Please check your inbox."));
            }

            String token = jwtUtil.generateToken(request.getUsername(), user.getRole().getName());
            ResponseCookie cookie = ResponseCookie.from("JWT", token)
                    .httpOnly(true)
                    .secure(false)
                    .path("/")
                    .sameSite("Lax")
                    .maxAge(jwtExpiration / 1000)
                    .build();
            response.setHeader(HttpHeaders.SET_COOKIE, cookie.toString());

            LoginResponse loginResp = new LoginResponse(user.getUsername(), user.getRole().getName(), user.getFull_name());
            return ResponseEntity.ok(loginResp);

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse(e.getMessage()));
        }
    }

    public ResponseEntity<Map<String, String>> verify(String token) {
        User user = tokenService.validateVerificationToken(token);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid or expired verification token"));
        }
        if (Boolean.TRUE.equals(user.getIs_verified())) {
            return ResponseEntity.ok(Map.of("message", "Email already verified"));
        }
        user.setIs_verified(true);
        userService.save(user);
        tokenService.removeTokenByUser(user);
        return ResponseEntity.ok(Map.of("message", "Email verified successfully!"));
    }

    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Not authenticated"));
        }

        User user = userService.findByUsername(authentication.getName());
        if (user == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();

        UserResponse resp = new UserResponse(
                user.getId(), user.getFull_name(), user.getUsername(),
                user.getEmail(), user.getPhone(),
                user.getRole() != null ? user.getRole().getName() : null
        );
        return ResponseEntity.ok(resp);
    }

    public ResponseEntity<?> logout(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("JWT", "")
                .httpOnly(true)
                .path("/")
                .maxAge(0)
                .build();
        response.setHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }
}

