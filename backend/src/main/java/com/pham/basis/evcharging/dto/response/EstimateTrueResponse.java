package com.pham.basis.evcharging.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class EstimateTrueResponse {
    private Double energyKwh;
    private Double estimatedCost;
    private int estimatedMinutes;
    private Double socTarget;
    private Double minuteUntilEnd;
}
