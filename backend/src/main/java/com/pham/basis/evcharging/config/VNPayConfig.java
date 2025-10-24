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

    // Sinh chuỗi HMAC SHA512
    public static String hmacSHA512(String key, String data) {
        return HmacUtils.hmacSha512Hex(key, data);
    }

    // Lấy IP client
    public static String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-FORWARDED-FOR");
        if (ip == null || ip.isEmpty()) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
    // Random UUID cho vnp_TxnRef
    public static String generateTxnRef() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase();
    }

    public static String buildQuery(Map<String, String> params) {
        if (params == null || params.isEmpty()) return "";
        try {
            List<String> keys = new ArrayList<>(params.keySet());
            Collections.sort(keys);
            StringBuilder sb = new StringBuilder();
            boolean first = true;
            for (String k : keys) {
                String v = params.get(k);
                if (v == null || v.isEmpty()) continue;
                if (!first) sb.append("&");
                sb.append(URLEncoder.encode(k, StandardCharsets.UTF_8.name()))
                        .append("=")
                        .append(URLEncoder.encode(v, StandardCharsets.UTF_8.name()));
                first = false;
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to build query", e);
        }
    }


    public boolean verifySignature(Map<String, String> params, String receivedHash) {
        if (receivedHash == null) return false;
        String query = buildQuery(params);
        String expectedHash = hmacSHA512(vnpHashSecret, query);
        return expectedHash.equalsIgnoreCase(receivedHash);
    }

}