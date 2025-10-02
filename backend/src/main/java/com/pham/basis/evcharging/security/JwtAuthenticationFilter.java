package com.pham.basis.evcharging.security;


import com.pham.basis.evcharging.service.UserService;
import io.jsonwebtoken.io.IOException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtUtil jwtUtil;
    private final UserService userService;

    public JwtAuthenticationFilter(JwtUtil jwtUtil, UserService userService) {
        this.jwtUtil = jwtUtil;
        this.userService = userService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException, java.io.IOException {
        String token = extractJwtFromCookie(request);
        if (StringUtils.hasText(token) && jwtUtil.validateToken(token)) {
            String username = jwtUtil.extractUsername(token);
            String role = jwtUtil.extractRole(token);
            // tạo Authentication
            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    username,
                    null,
                    List.of(new SimpleGrantedAuthority(role))
            );
            SecurityContextHolder.getContext().setAuthentication(auth);
        }
        filterChain.doFilter(request, response);
    }

    private String extractJwtFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        for (Cookie cookie : request.getCookies()) {
            if ("JWT".equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
