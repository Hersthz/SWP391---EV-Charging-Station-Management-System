package com.pham.basis.evcharging.dto.request;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class SubscriptionPlanRequest {
    private String name;
    private double price;
    private String billingCycle;  // monthly / yearly
    private double includedKwh;
    private String description;
}
