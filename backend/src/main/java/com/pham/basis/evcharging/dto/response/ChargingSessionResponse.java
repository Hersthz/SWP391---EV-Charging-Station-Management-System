package com.pham.basis.evcharging.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class ChargingSessionResponse {
    private Long id;
    private Long stationId;
    private Long pillarId;
    private Long driverUserId;
    private Long vehicleId;
    private String status;
    private BigDecimal energyCount;
    private BigDecimal chargedAmount;
    private BigDecimal ratePerKwh;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
}

