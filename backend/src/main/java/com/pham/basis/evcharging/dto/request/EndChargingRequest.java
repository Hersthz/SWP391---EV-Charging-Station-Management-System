package com.pham.basis.evcharging.dto.request;

import lombok.Data;

@Data
public class EndChargingRequest {
    private double energy;
    private double totalCost;
    private Long voucherId; // có thể null
}