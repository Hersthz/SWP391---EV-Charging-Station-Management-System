package com.pham.basis.evcharging.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter @AllArgsConstructor
public class LoyaltyPointResponse {
    private int pointsEarned;
    private BigDecimal amountPaid;
    private LocalDateTime createdAt;
}
