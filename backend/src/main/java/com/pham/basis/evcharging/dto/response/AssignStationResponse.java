package com.pham.basis.evcharging.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignStationResponse {
    private Long userId;
    private String username;
    private Long stationId;
    private String stationName;
    private String message;
}
