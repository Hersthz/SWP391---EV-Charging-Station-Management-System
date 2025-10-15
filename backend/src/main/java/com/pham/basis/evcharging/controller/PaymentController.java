package com.pham.basis.evcharging.controller;


import com.pham.basis.evcharging.config.VNPayConfig;
import com.pham.basis.evcharging.dto.request.PaymentCreateRequest;
import com.pham.basis.evcharging.dto.response.ApiResponse;
import com.pham.basis.evcharging.dto.response.PaymentResponse;
import com.pham.basis.evcharging.dto.response.PaymentResultResponse;
import com.pham.basis.evcharging.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.security.Principal;
import java.util.*;


@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {
    private static final Logger logger = LoggerFactory.getLogger(PaymentController.class);
    private final VNPayConfig vnPayConfig;
    private final PaymentService paymentService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<PaymentResponse>> createPayment(
            @Valid @RequestBody PaymentCreateRequest req,
            HttpServletRequest servletRequest,
            Principal principal
    ) {
//        if (principal == null) {
//            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
//                    .body(new ApiResponse<>("401", "Unauthorized", null));
//        }
//        Long userId = extractUserId(principal);
//        if (userId == null) {
//            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
//                    .body(new ApiResponse<>("401", "Invalid user identity", null));
//        }
        Long userId = 10L;
        String clientIp = vnPayConfig.getClientIp(servletRequest);

        logger.info("Create payment request: reservationId={}, userId={}, amount={}",
                req.getReferenceId(), userId, req.getAmount());

        PaymentResponse resp = paymentService.createPayment(req, userId, clientIp);
        return ResponseEntity.ok(new ApiResponse<>("00", "Tạo link thanh toán thành công", resp));
    }

    @GetMapping("/vnpay-ipn")
    public ResponseEntity<String> handleIpn(HttpServletRequest request) {
        System.out.println("chay dc roi");
        return ResponseEntity.ok(paymentService.handleIpn(request));
    }

    @GetMapping("/payment-return")
    public ResponseEntity<?> handleVnpayReturn(HttpServletRequest request) {
        try {
            PaymentResultResponse result = paymentService.vnpReturn(request);

            // Redirect về frontend với trạng thái
            String redirectUrl = buildFrontendRedirectUrl(result);
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header("Location", redirectUrl)
                    .build();

        } catch (Exception e) {
            logger.error("Error processing return URL", e);
            String fallbackUrl = "https://your-frontend.com/payment/error";
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header("Location", fallbackUrl)
                    .build();
        }
    }

    private String buildFrontendRedirectUrl(PaymentResultResponse result) {


        return UriComponentsBuilder.fromHttpUrl(frontendUrl)
                .queryParam("status", result.getStatus())
                .queryParam("orderId", result.getOrderId())
                .queryParam("message", result.getMessage())
                .queryParam("amount", result.getAmount())
                .queryParam("transactionNo", result.getTransactionNo())
                .toUriString();
    }

}



