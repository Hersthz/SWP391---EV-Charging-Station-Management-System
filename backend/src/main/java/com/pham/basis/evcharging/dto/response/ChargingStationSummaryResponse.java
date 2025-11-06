package com.pham.basis.evcharging.dto.response;


import lombok.*;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ChargingStationSummaryResponse {
    private Long id;
    private String name;
    private String address;
    private Double latitude;
    private Double longitude;
    private Double distance;
    private String status;
    private Integer availableConnectors;
    private Integer totalConnectors;
    private Double minPrice;
    private Double maxPrice;
    private Double minPower;
    private Double maxPower;
    private String url;
    private List<String> connectorTypes;
}