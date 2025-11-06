package com.pham.basis.evcharging.dto.response;

import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Getter
@Setter
@Builder
public class PaymentResponse {
    private Long paymentId;
    private String paymentUrl;
    private String txnRef;
    private BigDecimal amount;
    private String type;
    private String method;
    private Long referenceId;
    private String status; // PENDING / SUCCESS / FAILED
    private OffsetDateTime expiresAt;
}
