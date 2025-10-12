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
    private String secretBase64;


    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretBase64);
        return Keys.hmacShaKeyFor(keyBytes);
    }


    public String generateAccessToken(String username, String role, long expirySeconds) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + expirySeconds * 1000);
        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .claim("type", "access")
                .setIssuer("EV-Charging-API")
                .setId(UUID.randomUUID().toString())
                .setIssuedAt(now)
                .setExpiration(exp)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }


    public String generateRefreshToken(String username, long expirySeconds) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + expirySeconds * 1000);
        return Jwts.builder()
                .setSubject(username)
                .claim("type", "refresh")
                .setIssuer("EV-Charging-API")
                .setId(UUID.randomUUID().toString())
                .setIssuedAt(now)
                .setExpiration(exp)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }


    private String stripBearer(String token) {
        if (token == null) return null;
        token = token.trim();
        if (token.startsWith("Bearer ")) return token.substring(7);
        return token;
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

    public boolean validateRefreshToken(String token) {
        if (!validateToken(token)) return false;
        token = stripBearer(token);
        try {
            Claims claims = Jwts.parser()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            Object type = claims.get("type");
            return "refresh".equals(type);
        } catch (JwtException e) {
            logger.info("Refresh token invalid: {}", e.getMessage());
            return false;
        }
    }
}
