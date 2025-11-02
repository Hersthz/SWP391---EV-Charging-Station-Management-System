package com.pham.basis.evcharging.dto.response;


import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
public class ChargingStopResponse {
    private Long sessionId;
    private BigDecimal totalAmount;
    private String paymentMethod;
    private boolean requiresPayment;
}
