package com.pham.basis.evcharging.dto.response;


import lombok.Data;

import java.time.LocalDateTime;


@Data
public class SubscriptionPlanResponse {
    private Integer planId;
    private String name;
    private double price;
    private String billingCycle;
    private double includedKwh;
    private String description;
    private double discountRate;
    private Boolean freeBooking;
    private LocalDateTime createdAt;
}
