package com.pham.basis.evcharging.dto.request;

import com.pham.basis.evcharging.model.ChargerPillar;
import jakarta.validation.Valid;
import lombok.Data;

import java.util.List;

@Data
public class StationRequest {
    private String stationName;
    private String address;
    private double latitude;
    private double longitude;
    @Valid
    private List<PillarRequest> pillars;

    @Data
    public static class PillarRequest {
        private String code;
        private Double power;
        private Double pricePerKwh;
        @Valid
        private List<ConnectorRequest> connectors;

    }
    @Data
    public static class ConnectorRequest {

        private String connectorType;
    }
}
