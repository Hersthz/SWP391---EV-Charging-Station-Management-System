package com.pham.basis.evcharging.dto.request;


import lombok.Data;

@Data
public class LocationRequest {
    private Double latitude;
    private Double longitude;
    private Double radius; // Bán kính tìm kiếm (km), mặc định 5km

    public Double getRadius() {
        return radius != null ? radius : 5.0;
    }
}
