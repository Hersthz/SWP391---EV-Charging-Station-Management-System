package com.pham.basis.evcharging.dto.response;

import com.pham.basis.evcharging.model.Connector;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChargingStationDetailResponse {
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
    private List<PillarDto> pillars;
    private List<ReviewDto> reviews;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PillarDto {
        private String code;
        private String status;
        private Double power;
        private Double pricePerKwh;
        private List<ConnectorDto> connectors;
    }
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConnectorDto {
        private Long id;
        private String type;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReviewDto {
        private String id;
        private String userName;
        private Integer rating;
        private String comment;
        private String createdAt;
    }
}