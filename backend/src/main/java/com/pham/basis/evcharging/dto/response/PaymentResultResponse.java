package com.pham.basis.evcharging.dto.response;


import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResultResponse {
    private String status;        // "SUCCESS" | "FAILED" | "INVALID_SIGNATURE"
    private String orderId;       // vnp_TxnRef
    private String message;
    private BigDecimal amount;    // VND
    private String transactionNo; // vnp_TransactionNo
    private String type;          // "WALLET" | "RESERVATION" | "CHARGING-SESSION" 
    private Long referenceId;
}