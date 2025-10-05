package com.pham.basis.evcharging.controller;

import lombok.Data;

@Data
public class AddStationRequest {
    private Long stationId;
    private String stationName;
    private String address;
    private double latitude;
    private double longitude;
    private String status;
    @Data
    public static class PillarRequest {
        private Long pillarId;
        private String code;
        private int power;
        private double pricePerKmh;
        private String status;
        private Long stationId;
    }
    @Data
    public static class ConnectorRequest{
        private Long connectorId;
        private String connectorType;
    }
}
