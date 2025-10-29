package com.pham.basis.evcharging.dto.request;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class SubscriptionRequest {
    private Long userId;
    private Long planId;
    private LocalDate startDate;
}