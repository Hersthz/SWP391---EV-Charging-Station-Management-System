package com.pham.basis.evcharging.dto.response;


import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class ChargingStationSummaryResponse {
    private Long id;
    private String name;
    private String address;
    private Double latitude;
    private Double longitude;
    private Double distance;
    private String status;
    private Integer availablePillars;
    private Integer totalPillars;
    private Double minPrice;
    private Double maxPrice;
    private Double minPower;
    private Double maxPower;
    private List<String> connectorTypes;
}