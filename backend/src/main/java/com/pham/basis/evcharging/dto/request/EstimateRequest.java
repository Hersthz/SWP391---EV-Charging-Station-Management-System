package com.pham.basis.evcharging.dto.request;

import lombok.Data;

@Data
public class EstimateRequest {
    private Long vehicleId;
    private Long stationId;
    private Long pillarId;
    private Long connectorId;
    private Double socNow ;
    private Double socTarget  ;
}
