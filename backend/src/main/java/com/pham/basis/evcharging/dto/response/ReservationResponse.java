package com.pham.basis.evcharging.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ReservationResponse {

    private Long reservationId;

    private Long userId;

    private Long stationId;
    private String stationName;

    private Long pillarId;
    private String pillarCode;

    private Long connectorId;
    private String connectorType;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private String status;
    private BigDecimal holdFee;

    private LocalDateTime createdAt;
}