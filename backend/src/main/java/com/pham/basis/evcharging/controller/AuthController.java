package com.pham.basis.evcharging.controller;

import com.pham.basis.evcharging.dto.request.LoginRequest;
import com.pham.basis.evcharging.dto.request.UserCreationRequest;
import com.pham.basis.evcharging.dto.response.UserResponse;
import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.security.CookieUtil;
import com.pham.basis.evcharging.security.JwtUtil;
import com.pham.basis.evcharging.service.AuthService;
import com.pham.basis.evcharging.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
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

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@RequestBody UserCreationRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req, HttpServletResponse response) {
        User user = userService.login(req.getUsername(), req.getPassword());
        if (!Boolean.TRUE.equals(user.getIs_verified())) {
            return ResponseEntity.status(403).body(Map.of("message", "Email not verified"));
        }

        String access = jwtUtil.generateAccessToken(user.getUsername(), user.getRole().getName(), accessExpiry);
        String refresh = jwtUtil.generateRefreshToken(user.getUsername(), refreshExpiry);

        ResponseCookie accessCookie = CookieUtil.createCookie(
                "JWT", access, accessExpiry, true, cookieSecure, cookieSecure ? "None" : "Lax");
        ResponseCookie refreshCookie = CookieUtil.createCookie(
                "REFRESH", refresh, refreshExpiry, true, cookieSecure, cookieSecure ? "None" : "Lax");

        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

        return ResponseEntity.ok(Map.of("message", "logged_in"));
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
        ResponseCookie accessDel = CookieUtil.deleteCookie("JWT");
        ResponseCookie refreshDel = CookieUtil.deleteCookie("REFRESH");
        response.addHeader(HttpHeaders.SET_COOKIE, accessDel.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshDel.toString());
        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request, HttpServletResponse response) {
        // Lấy refresh token từ cookie
        String refreshToken = null;
        if (request.getCookies() != null) {
            for (Cookie c : request.getCookies()) {
                if ("REFRESH".equals(c.getName())) {
                    refreshToken = c.getValue();
                }
            }
        }

        if (refreshToken == null || !jwtUtil.validateRefreshToken(refreshToken)) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid refresh token"));
        }

        String username = jwtUtil.extractUsername(refreshToken);
        String role = jwtUtil.extractRole(refreshToken);

        String newAccess = jwtUtil.generateAccessToken(username, role, accessExpiry);
        ResponseCookie newAccessCookie = CookieUtil.createCookie(
                "JWT", newAccess, accessExpiry, true, cookieSecure, cookieSecure ? "None" : "Lax");

        response.addHeader(HttpHeaders.SET_COOKIE, newAccessCookie.toString());
        return ResponseEntity.ok(Map.of("message", "refreshed"));
    }
}
