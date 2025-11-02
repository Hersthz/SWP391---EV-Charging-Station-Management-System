package com.pham.basis.evcharging.dto.response;


import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@Builder
public class EstimateResponse {
    private double energyKwh;
    private double energyFromStationKwh;
    private double estimatedCost;
    private int estimatedMinutes;
    private String advice;
}
