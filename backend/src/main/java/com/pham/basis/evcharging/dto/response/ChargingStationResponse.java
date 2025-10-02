package com.pham.basis.evcharging.dto.response;


import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class ChargingStationResponse {
    private Long id;
    private String name;
    private String address;
    private Double latitude;
    private Double longitude;
    private Double distance; // km
    private String status;

    private String power;
    private String available;
    private List<String> connectors;
    private String price;

}