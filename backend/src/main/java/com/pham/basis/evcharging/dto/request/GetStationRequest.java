package com.pham.basis.evcharging.dto.request;

import lombok.Data;

@Data
public class GetStationRequest {
    private Long stationId;
    private Double latitude;
    private Double longitude;
}
