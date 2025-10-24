package com.pham.basis.evcharging.dto.response;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class EstimateResponse {
    private double energyKwh;
    private double energyFromStationKwh;
    private double estimatedCost;
    private int estimatedMinutes;
    private String advice;
}
