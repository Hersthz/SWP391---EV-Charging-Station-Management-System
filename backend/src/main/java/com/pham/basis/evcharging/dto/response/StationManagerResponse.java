package com.pham.basis.evcharging.dto.response;

import lombok.*;

@Getter
@Setter
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
