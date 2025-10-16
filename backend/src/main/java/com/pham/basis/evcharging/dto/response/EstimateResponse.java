package com.pham.basis.evcharging.dto.response;


import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class EstimateResponse {
    private double energyKwh;
    private int estimatedMinutes;
    private String advice;
}
