package com.pham.basis.evcharging.controller;


import com.pham.basis.evcharging.config.VNPayConfig;
import com.pham.basis.evcharging.dto.request.PaymentCreateRequest;
import com.pham.basis.evcharging.dto.response.ApiResponse;
import com.pham.basis.evcharging.dto.response.PaymentResponse;
import com.pham.basis.evcharging.dto.response.PaymentResultResponse;
import com.pham.basis.evcharging.dto.response.PaymentTransactionResponse;
import com.pham.basis.evcharging.repository.UserRepository;
import com.pham.basis.evcharging.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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
    private final UserRepository userRepository;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<PaymentResponse>> createPayment(
            @Valid @RequestBody PaymentCreateRequest req,
            HttpServletRequest servletRequest,
            Principal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>("401", "Unauthorized", null));
        }
        Long userId = userRepository.findUserByUsername(principal.getName()).getId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>("401", "Invalid user identity", null));
        }
        String clientIp = vnPayConfig.getClientIp(servletRequest);

        logger.info("Create payment request: reservationId={}, userId={}, amount={}",
                req.getReferenceId(), userId, req.getAmount());

        PaymentResponse resp = paymentService.createPayment(req, userId, clientIp);
        return ResponseEntity.ok(new ApiResponse<>("00", "Tạo link thanh toán thành công", resp));
    }

    @GetMapping("/vnpay-ipn")
    public ResponseEntity<String> handleIpn(HttpServletRequest request) {
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
            String fallbackUrl = "http://localhost:5173";
            return ResponseEntity.status(HttpStatus.FOUND)
                    .header("Location", fallbackUrl)
                    .build();
        }
    }

    private String buildFrontendRedirectUrl(PaymentResultResponse result) {
        String path = "/depositss";
        if ("WALLET".equalsIgnoreCase(result.getType())) {
            path = "/wallet/topup-result";
        } else if ("CHARGING-SESSION".equalsIgnoreCase(result.getType())) {
            path = "/session-payment-result";
        }

        return UriComponentsBuilder.fromHttpUrl(frontendUrl + path)
                .queryParam("status", result.getStatus())
                .queryParam("orderId", result.getOrderId())
                .queryParam("message", result.getMessage())
                .queryParam("amount", result.getAmount())
                .queryParam("transactionNo", result.getTransactionNo())
                .toUriString();
    }

    @GetMapping("/getPaymentU")
    public ResponseEntity<Page<PaymentTransactionResponse>> getPaymentU(
            Principal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int pageSize
    ) {
        Long userId = userRepository.findUserByUsername(principal.getName()).getId();
        Pageable pageable = PageRequest.of(page, pageSize);
        Page<PaymentTransactionResponse> result = paymentService.getPaymentTransactionByUserId(userId, pageable);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/getPayment")
    public ResponseEntity<Page<PaymentTransactionResponse>> getPayment(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int pageSize) {

        Pageable pageable = PageRequest.of(page, pageSize);
        Page<PaymentTransactionResponse> result = paymentService.getAllPaymentTransaction(pageable);
        return ResponseEntity.ok(result);
    }

}



