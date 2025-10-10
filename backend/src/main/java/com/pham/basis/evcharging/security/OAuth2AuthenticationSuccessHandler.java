package com.pham.basis.evcharging.security;

import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.service.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${jwt.expiration:86400000}")
    private long jwtExpiration;


    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();
        String email = oauthUser.getAttribute("email");
        String name = oauthUser.getAttribute("name");
        User user = userService.findByEmail(email);
        if (user == null) {
            // đảm bảo user đã được tạo bởi CustomOAuth2UserService; nhưng fallback:
            userService.createOrUpdateFromOAuth(email, oauthUser.getAttribute("name"), true);
            user = userService.findByEmail(email);
        }
        String role = user.getRole() != null ? user.getRole().getName() : "ROLE_USER";
        String token = jwtUtil.generateToken(user.getUsername(), role);
        ResponseCookie cookie = ResponseCookie.from("JWT", token)
                .httpOnly(true)
                .secure(false) // true nếu HTTPS
                .path("/")
                .maxAge(jwtExpiration / 1000)
                .sameSite("Lax")
                .build();

        response.setHeader("Set-Cookie", cookie.toString());

        response.sendRedirect(frontendUrl + "/dashboard");
    }
}
