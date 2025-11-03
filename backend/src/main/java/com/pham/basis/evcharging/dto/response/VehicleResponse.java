package com.pham.basis.evcharging.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
@Builder
public class VehicleResponse {
    private Long id;
    private String make;
    private String model;
    private Double currentSoc;
    private Double batteryCapacityKwh;
    private Double acMaxKw;
    private Double dcMaxKw;
    private Double efficiency;
}
