package com.pham.basis.evcharging.dto.response;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResultResponse {
    private String status;        // "SUCCESS" | "FAILED" | "INVALID_SIGNATURE"
    private String orderId;       // vnp_TxnRef
    private String message;
    private BigDecimal amount;    // VND
    private String transactionNo; // vnp_TransactionNo
}