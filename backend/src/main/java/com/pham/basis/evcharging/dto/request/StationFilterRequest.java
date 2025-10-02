package com.pham.basis.evcharging.dto.request;


import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class StationFilterRequest {
    private Double latitude;
    private Double longitude;
    private Double radius;
    private List<String> connectors = new ArrayList<>();
    private Boolean availableOnly = false;
    private Double minPower;
    private Double maxPower;
    private Double minPrice;
    private Double maxPrice;
    private String sort;
    private Integer page = 0;
    private Integer size = 10;
}
