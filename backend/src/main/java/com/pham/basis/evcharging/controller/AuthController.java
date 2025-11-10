package com.pham.basis.evcharging.controller;

import com.pham.basis.evcharging.dto.request.ForgotPasswordRequest;
import com.pham.basis.evcharging.dto.request.LoginRequest;
import com.pham.basis.evcharging.dto.request.ResetPasswordRequest;
import com.pham.basis.evcharging.dto.request.UserCreationRequest;
import com.pham.basis.evcharging.dto.response.LoginResponse;
import com.pham.basis.evcharging.dto.response.UserResponse;
import com.pham.basis.evcharging.exception.AppException;
import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.security.CookieUtil;
import com.pham.basis.evcharging.security.JwtUtil;
import com.pham.basis.evcharging.service.AuthService;
import com.pham.basis.evcharging.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@CrossOrigin
public class AuthController {
    private final AuthService authService;
    private final UserService userService;
    private final JwtUtil jwtUtil;

    @Value("${jwt.access-expiry-seconds:900}")
    private long accessExpiry;

    @Value("${jwt.refresh-expiry-seconds:172800}")
    private long refreshExpiry;

    @Value("${app.cookie.secure:false}")
    private boolean cookieSecure;

    private String cookieSameSite() {
        return cookieSecure ? "None" : "Lax";
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody UserCreationRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req, HttpServletResponse response) {
        User user = userService.login(req.getUsername(), req.getPassword());
        if (!Boolean.TRUE.equals(user.getIsVerified())) {
            throw new AppException.ForbiddenException("Email not verified");
        }
        if (user.getStatus() != null && !user.getStatus()) {
            throw new AppException.ForbiddenException("Account has been deactivated");
        }

        String roleName = user.getRole() != null ? user.getRole().getName() : "USER";

        String access = jwtUtil.generateAccessToken(user.getUsername(), roleName, accessExpiry);
        String refresh = jwtUtil.generateRefreshToken(user.getUsername(), roleName, refreshExpiry);

        String sameSite = cookieSameSite();
        ResponseCookie accessCookie = CookieUtil.createCookie("JWT", access, accessExpiry, true, cookieSecure, sameSite);
        ResponseCookie refreshCookie = CookieUtil.createCookie("REFRESH", refresh, refreshExpiry, true, cookieSecure, sameSite);

        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

        LoginResponse loginResp = new LoginResponse(user.getUsername(), roleName, user.getFullName(), user.getId());
        return ResponseEntity.ok(loginResp);
    }

    @GetMapping("/verify")
    public ResponseEntity<Map<String, String>> verify(@RequestParam("token") String token) {
        return authService.verify(token);
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        return authService.getCurrentUser(authentication);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        String sameSite = cookieSameSite();
        ResponseCookie accessDel = CookieUtil.deleteCookie("JWT", cookieSecure, sameSite);
        ResponseCookie refreshDel = CookieUtil.deleteCookie("REFRESH", cookieSecure, sameSite);

        response.addHeader(HttpHeaders.SET_COOKIE, accessDel.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshDel.toString());
        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = null;
        if (request.getCookies() != null) {
            for (Cookie c : request.getCookies()) {
                if ("REFRESH".equals(c.getName())) {
                    refreshToken = c.getValue();
                    break;
                }
            }
        }

        if (refreshToken == null || !jwtUtil.validateRefreshToken(refreshToken)) {
            throw new AppException.UnauthorizedException("Invalid refresh token");
        }

        String username = jwtUtil.extractUsername(refreshToken);
        String role = jwtUtil.extractRole(refreshToken);

        if (role == null) {
            User u = userService.findByUsername(username);
            role = (u != null && u.getRole() != null) ? u.getRole().getName() : "ROLE_USER";
        }

        String newAccess = jwtUtil.generateAccessToken(username, role, accessExpiry);

        ResponseCookie newAccessCookie = CookieUtil.createCookie("JWT", newAccess, accessExpiry, true, cookieSecure, cookieSameSite());

        response.addHeader(HttpHeaders.SET_COOKIE, newAccessCookie.toString());
        return ResponseEntity.ok(Map.of("message", "refreshed"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok("Password reset email sent.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok("Password updated.");
    }
}

