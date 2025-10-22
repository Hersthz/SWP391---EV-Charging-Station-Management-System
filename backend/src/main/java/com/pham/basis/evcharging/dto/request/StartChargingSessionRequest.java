package com.pham.basis.evcharging.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StartChargingSessionRequest {
    @NotNull(message = "Reservation ID is required")
    private Long reservationId;

    @NotNull(message = "Pillar ID is required")
    private Long pillarId;

    @NotNull(message = "Driver ID is required")
    private Long driverId;

    @NotNull
    private Long vehicleId;

    private Double targetSoc;

    @NotNull
    private String paymentMethod;
}
