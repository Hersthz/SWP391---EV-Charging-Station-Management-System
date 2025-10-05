package com.pham.basis.evcharging.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class ReservationRequest {
    private Long userId;
    private Long stationId;
    private Long pillarId;
    private Long connectorId;
    private Integer durationMinutes;
}
