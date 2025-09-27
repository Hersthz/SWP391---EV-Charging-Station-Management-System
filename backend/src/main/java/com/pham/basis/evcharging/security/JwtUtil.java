package com.pham.basis.evcharging.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtUtil {

    private static final Logger logger = LoggerFactory.getLogger(JwtUtil.class);
    // logger (bộ ghi log) ghi thông tin cảnh báo lỗi ...
    //Có thể cấu hình mức log (INFO, DEBUG, WARN, ERROR).

    // Inject từ application.properties: jwt.secret (Base64-encoded secret)
    @Value("${jwt.secret}")
    private String SECRET;
    //SECRET là secret key dùng để:Ký (sign) JWT token khi tạo.Xác thực (verify) token khi parse lại.
    // ms * s * m
    private final long EXPIRATION_TIME = 1000 * 60 * 30;


    private SecretKey getSigningKey() {
        if (SECRET == null || SECRET.trim().isEmpty()) {
            throw new IllegalStateException("JWT secret is not configured (jwt.secret).");
        }
        byte[] keyBytes = SECRET.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private String stripBearer(String token) {
        if (token == null) return null;
        token = token.trim();
        if (token.startsWith("Bearer ")) // Nếu chuỗi bắt đầu bằng "Bearer "
            return token.substring(7);// Cắt bỏ 7 ký tự đầu ("Bearer ")
        return token;
    }

    public String generateToken(String username, String role) {
        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .setIssuer("EV-Charging-API")
                .setId(UUID.randomUUID().toString())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        token = stripBearer(token);
        if (token == null) return null;
        Claims claims = Jwts.parser()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claims.getSubject();
    }

    public String extractRole(String token) {
        token = stripBearer(token);
        if (token == null) return null;
        Claims claims = Jwts.parser()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        Object role = claims.get("role");
        return role != null ? role.toString() : null;
    }

    public boolean validateToken(String token) {
        token = stripBearer(token);
        if (token == null) return false;
        try {
            Jwts.parser()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (ExpiredJwtException e) {
            logger.info("JWT expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.info("Unsupported JWT: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            logger.info("Malformed JWT: {}", e.getMessage());
        } catch (SecurityException | SignatureException e) {
            logger.info("Invalid JWT signature: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.info("JWT invalid: {}", e.getMessage());
        } catch (JwtException e) {
            logger.info("JWT error: {}", e.getMessage());
        }
        return false;
    }
}
