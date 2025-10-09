package com.pham.basis.evcharging.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ReservationRequest {
    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Station ID is required")
    private Long stationId;

    @NotNull(message = "Pillar ID is required")
    private Long pillarId;

    @NotNull(message = "Connector ID is required")
    private Long connectorId;

    @Min(value = 1, message = "ETA minutes must be at least 1")
    private Integer arrivalEtaMinutes;
}
