package com.pham.basis.evcharging.dto.request;

import lombok.Data;

@Data
public class AssignStationRequest {
    private Long userId;
    private Long stationId;
}
