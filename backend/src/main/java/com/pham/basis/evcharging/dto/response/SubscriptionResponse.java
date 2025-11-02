package com.pham.basis.evcharging.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class SubscriptionResponse {
    private Integer subscriptionId;
    private Integer userId;
    private Integer planId;
    private String planName;
    private String status;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private double priceAtPurchase;
    private LocalDateTime createdAt;
}