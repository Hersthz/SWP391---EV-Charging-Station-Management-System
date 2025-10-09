package com.pham.basis.evcharging.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ReservationResponse {
    private Long reservationId;
    private Long stationId;
    private String stationName;
    private Long pillarId;
    private Long connectorId;
    private String status;
    private BigDecimal holdFee;
    private String depositTransaction;
    private LocalDateTime createdAt;
    private LocalDateTime expiredAt;
}