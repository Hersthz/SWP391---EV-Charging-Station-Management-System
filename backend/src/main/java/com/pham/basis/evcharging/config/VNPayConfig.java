package com.pham.basis.evcharging.config;

import jakarta.servlet.http.HttpServletRequest;
import org.apache.commons.codec.digest.HmacUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Slf4j
@Configuration
@Getter
public class VNPayConfig {

    @Value("${VNP_TMNCODE:}")
    private String vnpTmnCode;

    @Value("${VNP_HASH_SECRET:}")
    private String vnpHashSecret;

    @Value("${VNP_PAY_URL:}")
    private String vnpPayUrl;

    @Value("${VNP_RETURN_URL:}")
    private String vnpReturnUrl;

    @Value("${VNP_IPN_URL:}")
    private String vnpIpnUrl;

    @Value("${VNP_API_VERSION:2.1.0}")
    private String vnpApiVersion;

    @jakarta.annotation.PostConstruct
    public void validateConfig() {
        if (vnpTmnCode == null || vnpTmnCode.trim().isEmpty()) {
            log.error("VNP_TMNCODE is not configured");
            throw new IllegalStateException("VNP_TMNCODE is required");
        }
        if (vnpHashSecret == null || vnpHashSecret.trim().isEmpty()) {
            log.error("VNP_HASH_SECRET is not configured");
            throw new IllegalStateException("VNP_HASH_SECRET is required");
        }
        if (vnpPayUrl == null || vnpPayUrl.trim().isEmpty()) {
            log.error("VNP_PAY_URL is not configured");
            throw new IllegalStateException("VNP_PAY_URL is required");
        }
        log.info("VNPay configuration loaded successfully - TMNCode: {}", vnpTmnCode);
    }

    public static String hmacSHA512(String key, String data) {
        return HmacUtils.hmacSha512Hex(key, data);
    }

    public static String getClientIp(HttpServletRequest request) {
        try {
            // List of headers to check (in order of priority)
            String[] headers = {
                    "X-Forwarded-For",
                    "X-Real-IP",
                    "Proxy-Client-IP",
                    "WL-Proxy-Client-IP",
                    "HTTP_CLIENT_IP",
                    "HTTP_X_FORWARDED_FOR"
            };

            for (String header : headers) {
                String ip = request.getHeader(header);
                if (isValidIp(ip)) {
                    // X-Forwarded-For can contain multiple IPs, take the first one
                    if (header.equals("X-Forwarded-For") && ip.contains(",")) {
                        ip = ip.split(",")[0].trim();
                    }
                    return normalizeIpAddress(ip);
                }
            }

            // Fallback to remote address
            return normalizeIpAddress(request.getRemoteAddr());

        } catch (Exception e) {
            log.warn("Error getting client IP, using fallback", e);
            return "127.0.0.1";
        }
    }

    private static boolean isValidIp(String ip) {
        return ip != null &&
                !ip.isEmpty() &&
                !"unknown".equalsIgnoreCase(ip) &&
                !"0:0:0:0:0:0:0:1".equals(ip);
    }
    private static String normalizeIpAddress(String ip) {
        if (ip == null || ip.isEmpty()) {
            return "127.0.0.1";
        }

        if ("0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip)) {
            return "127.0.0.1";
        }

        if (ip.contains(":") && !ip.contains(".")) {
            log.warn("IPv6 address detected: {}, using fallback", ip);
            return "127.0.0.1";
        }

        return ip;
    }

    public static String generateTxnRef() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
    }

    public static String buildQuery(Map<String, String> params) {
        try {
            List<String> fieldNames = new ArrayList<>(params.keySet());
            Collections.sort(fieldNames);
            StringBuilder sb = new StringBuilder();

            for (Iterator<String> itr = fieldNames.iterator(); itr.hasNext();) {
                String fieldName = itr.next();
                String fieldValue = params.get(fieldName);

                if (fieldValue != null && !fieldValue.isEmpty()) {
                    sb.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.name()))
                            .append("=")
                            .append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.name()));
                    if (itr.hasNext()) {
                        sb.append("&");
                    }
                }
            }
            return sb.toString();
        } catch (Exception e) {
            log.error("Error building query string", e);
            throw new RuntimeException("Failed to build query string", e);
        }
    }

    public static String hashAllFields(Map<String, String> params, String secretKey) {
        try {
            String query = buildQuery(params);
            log.debug("Hashing query: {}", query);
            return hmacSHA512(secretKey, query);
        } catch (Exception e) {
            log.error("Error hashing fields", e);
            throw new RuntimeException("Failed to hash fields", e);
        }
    }
}