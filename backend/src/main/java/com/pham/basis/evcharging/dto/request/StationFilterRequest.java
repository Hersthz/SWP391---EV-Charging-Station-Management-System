package com.pham.basis.evcharging.dto.request;

import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.ArrayList;
import java.util.List;

@Data
public class StationFilterRequest {
    @NotNull(message = "Latitude is required")
    private Double latitude;
    @NotNull(message = "Longitude is required")
    private Double longitude;
    @Positive(message = "Radius must be positive")
    private Double radius = 10.0;

    private List<String> connectors = new ArrayList<>();
    private Boolean availableOnly = false;
    private Double minPower;
    private Double maxPower;
    private Double minPrice;
    private Double maxPrice;
    private String sort = "distance";

    @PositiveOrZero(message = "Page must be positive")
    private Integer page = 0;

    @Positive(message = "Size must be positive")
    private Integer size = 10;

    private String search;
}