package com.pham.basis.evcharging.security;

import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import java.io.IOException;

@Component
public class OAuth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserService userService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${jwt.access-expiry-seconds:900}")
    private long accessExpiry;

    @Value("${jwt.refresh-expiry-seconds:172800}")
    private long refreshExpiry;

    @Value("${app.cookie.secure:false}")
    private boolean cookieSecure;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();
        String email = oauthUser.getAttribute("email");
        String name = oauthUser.getAttribute("name");
        String url = oauthUser.getAttribute("picture");

        User user = userService.findByEmail(email);

        String role = user.getRole() != null ? user.getRole().getName() : "USER";

        // Tạo access + refresh token (lưu ý: expiry là seconds ở JwtUtil định nghĩa trước)
        String access = jwtUtil.generateAccessToken(user.getUsername(), role, accessExpiry);
        String refresh = jwtUtil.generateRefreshToken(user.getUsername(),role, refreshExpiry);

        // Tạo cookie theo chuẩn dùng ở AuthController
        ResponseCookie accessCookie = CookieUtil.createCookie(
                "JWT", access, accessExpiry, true, cookieSecure, cookieSecure ? "None" : "Lax");
        ResponseCookie refreshCookie = CookieUtil.createCookie(
                "REFRESH", refresh, refreshExpiry, true, cookieSecure, cookieSecure ? "None" : "Lax");

        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

        String redirectUrl = frontendUrl;
        if ("ADMIN".equalsIgnoreCase(role)) {
            redirectUrl += "/admin";
        } else if ("STAFF".equalsIgnoreCase(role)) {
            redirectUrl += "/staff";
        } else {
            redirectUrl += "/dashboard";
        }

        response.sendRedirect(redirectUrl);
    }
}
