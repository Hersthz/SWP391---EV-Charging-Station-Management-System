package com.pham.basis.evcharging.service;


import com.pham.basis.evcharging.dto.request.PaymentCreateRequest;
import com.pham.basis.evcharging.dto.response.PaymentResponse;
import com.pham.basis.evcharging.dto.response.PaymentResultResponse;
import jakarta.servlet.http.HttpServletRequest;

public interface PaymentService {
    PaymentResponse createPayment(PaymentCreateRequest req, Long userId, String clientIp);

    String handleIpn(HttpServletRequest request);

    public PaymentResultResponse vnpReturn(HttpServletRequest request);
}

