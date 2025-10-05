package com.pham.basis.evcharging.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class AddStationResponse {
    private boolean success;
    private String message;

}
@Data
class StationDetailData{
    private Long stationId;
    private String stationName;
    private String address;
    private double latitude;
    private double longitude;
    private String status;
    private List<PillarDetailData> pillars;
}
@Data
class PillarDetailData {
    private String pillarId;
    private String code;
    private Integer power;
    private Double pricePerKwh;
    private String status;
    private List<ConnectorDetailData> connectors;
}

@Data
class ConnectorDetailData {
    private String connectorId;
    private String connectorType;
}
