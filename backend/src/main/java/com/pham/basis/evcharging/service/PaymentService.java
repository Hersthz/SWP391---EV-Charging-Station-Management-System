package com.pham.basis.evcharging.service;


import com.pham.basis.evcharging.dto.request.PaymentCreateRequest;
import com.pham.basis.evcharging.dto.response.PaymentResponse;
import com.pham.basis.evcharging.dto.response.PaymentResultResponse;
import com.pham.basis.evcharging.dto.response.PaymentTransactionResponse;
import com.pham.basis.evcharging.model.PaymentTransaction;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PaymentService {
    PaymentResponse createPayment(PaymentCreateRequest req, Long userId, String clientIp);

    String handleIpn(HttpServletRequest request);

    PaymentResultResponse vnpReturn(HttpServletRequest request);

    Page<PaymentTransactionResponse> getPaymentTransactionByUserId(Long userId, Pageable pageable);
    Page<PaymentTransactionResponse> getAllPaymentTransaction(Pageable pageable);
    PaymentTransaction getPaymentEntity(Long paymentId);
}

