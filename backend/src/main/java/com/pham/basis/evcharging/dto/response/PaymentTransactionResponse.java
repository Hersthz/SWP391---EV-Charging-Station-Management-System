package com.pham.basis.evcharging.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PaymentTransactionResponse {
    private Long id;
    private String txnRef;
    private BigDecimal amount;
    private String orderInfo;
    private String vnpTransactionNo;
    private String status;
    private LocalDateTime createdAt;
    private String type;
    private String method;
    private Long referenceId;
    private Long userId;
    private String username;
}
