package com.pham.basis.evcharging.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StationManagerResponse {
    private Long stationId;
    private String stationName;
    private String address;
    private String managerName;
    private String managerUsername;
    private String managerEmail;
}
