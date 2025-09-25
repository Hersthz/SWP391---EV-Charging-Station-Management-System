package com.pham.basis.evcharging.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {
    private final String SECRET = "ThisIsMySuperSecretKey1234567890"; // nên để ở config
    private final long EXPIRATION_TIME = 1000 * 60 * 60; // 1h

    private final Key key = Keys.hmacShaKeyFor(SECRET.getBytes());

    // Sinh token
    public String generateToken(String username) {
        return Jwts.builder()
                .setSubject(username) // gán username làm subject
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // Lấy username từ token
    public String extractUsername(String token) {
        return Jwts.parser().setSigningKey(key).build()
                .parseClaimsJws(token).getBody().getSubject();
    }

    // Kiểm tra token hợp lệ
    public boolean validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }
}

