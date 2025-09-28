package com.pham.basis.evcharging.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtUtil {
    private static final Logger logger = LoggerFactory.getLogger(JwtUtil.class);

    @Value("${jwt.secret}")
    private String SECRET_BASE64;

    @Value("${jwt.expiration:86400000}")
    private long EXPIRATION_TIME;

    private SecretKey getSigningKey() {
        if (SECRET_BASE64 == null || SECRET_BASE64.trim().isEmpty()) {
            throw new IllegalStateException("JWT secret is not configured (jwt.secret).");
        }
        byte[] keyBytes = Decoders.BASE64.decode(SECRET_BASE64);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private String stripBearer(String token) {
        if (token == null) return null;
        token = token.trim();
        if (token.startsWith("Bearer ")) return token.substring(7);
        return token;
    }

    public String generateToken(String username, String role) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + EXPIRATION_TIME);
        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .setIssuer("EV-Charging-API")
                .setId(UUID.randomUUID().toString())
                .setIssuedAt(now)
                .setExpiration(exp)
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
        Object r = claims.get("role");
        return r != null ? r.toString() : null;
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
