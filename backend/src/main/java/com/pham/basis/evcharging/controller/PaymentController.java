package com.pham.basis.evcharging.controller;


import com.pham.basis.evcharging.config.VNPayConfig;
import com.pham.basis.evcharging.dto.request.PaymentCreateRequest;
import com.pham.basis.evcharging.dto.response.ApiResponse;
import com.pham.basis.evcharging.dto.response.PaymentResponse;
import com.pham.basis.evcharging.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.*;


@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {
    private static final Logger logger = LoggerFactory.getLogger(PaymentController.class);
    private final VNPayConfig vnPayConfig;
    private final PaymentService paymentService;

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

    @GetMapping("/ipn")
    public ResponseEntity<String> handleIpn(HttpServletRequest request) {
        return ResponseEntity.ok(paymentService.handleIpn(request));
    }

    private Long extractUserId(Principal principal) {
        if (principal == null) return null;
        try {
            return Long.parseLong(principal.getName());
        } catch (Exception e) {
            return null;
        }
    }

}



