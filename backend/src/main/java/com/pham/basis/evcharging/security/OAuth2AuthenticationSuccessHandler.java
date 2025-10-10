package com.pham.basis.evcharging.security;

import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.service.UserService;
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

    @Value("${app.cookie.secure:true}")
    private boolean cookieSecure;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();
        String email = oauthUser.getAttribute("email");
        String name = oauthUser.getAttribute("name");

        User user = userService.findByEmail(email);
        if (user == null) {
            userService.createOrUpdateFromOAuth(email, name, true);
            user = userService.findByEmail(email);
        }

        String role = user.getRole() != null ? user.getRole().getName() : "USER";
        String token = jwtUtil.generateToken(user.getUsername(), role);

        ResponseCookie cookie = ResponseCookie.from("JWT", token)
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .maxAge(jwtExpiration / 1000)
                .sameSite("None")
                .build();

        response.addHeader("Set-Cookie", cookie.toString());

        // 🧭 Điều hướng theo role
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
