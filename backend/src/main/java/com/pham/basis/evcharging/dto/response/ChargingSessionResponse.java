package com.pham.basis.evcharging.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
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
    private Double targetSoc;
    private Double socNow;
}

