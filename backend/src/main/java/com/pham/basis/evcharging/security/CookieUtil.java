package com.pham.basis.evcharging.security;

import org.springframework.http.ResponseCookie;

public class CookieUtil {

    public static ResponseCookie createCookie(String name, String token, long maxAgeSeconds,boolean httpOnly, boolean secure, String sameSite) {
        return ResponseCookie.from(name, token)
                .httpOnly(httpOnly)
                .secure(secure)
                .sameSite(sameSite)
                .path("/")
                .maxAge(maxAgeSeconds)
                .build();
    }

    public static ResponseCookie deleteCookie(String name, boolean secure, String sameSite) {
        return ResponseCookie.from(name, "")
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path("/")
                .maxAge(0)
                .build();
    }
}
