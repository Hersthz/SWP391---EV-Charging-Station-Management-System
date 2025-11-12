package com.pham.basis.evcharging.dto.request;


import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EstimateTrueSpeedRequest {

        @NotNull(message = "Vehicle ID is required")
        private Long vehicleId;

        @NotNull(message = "Station ID is required")
        private Long stationId;

        @NotNull(message = "Pillar ID is required")
        private Long pillarId;

        @NotNull(message = "Connector ID is required")
        private Long connectorId;

        @NotNull(message = "Current SOC is required")
        private Double socNow;

        @NotNull(message = "Target SOC is required")
        private Double socTarget;

        private Double kW;

        private Double tick;

        private Long ReservationId;
}
