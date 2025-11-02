package com.pham.basis.evcharging.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.pham.basis.evcharging.model.Connector;
import lombok.*;

import java.util.List;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ChargingStationDetailResponse {
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
    private List<PillarDto> pillars;
    private List<ReviewDto> reviews;

    @Getter @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PillarDto {
        private Long id;
        private String code;
        private String status;
        private Double power;
        private Double pricePerKwh;
        private List<ConnectorDto> connectors;
    }
    @Getter @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ConnectorDto {
        private Long id;
        private String status;
        private String type;
    }

    @Getter @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReviewDto {
        private String id;
        private String userName;
        private Integer rating;
        private String comment;
        private String createdAt;
    }
}