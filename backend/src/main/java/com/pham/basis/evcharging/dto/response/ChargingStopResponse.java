package com.pham.basis.evcharging.dto.response;


import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ChargingStopResponse {
    private Long sessionId;
    private BigDecimal totalAmount;
    private String paymentMethod;
    private boolean requiresPayment;
}
