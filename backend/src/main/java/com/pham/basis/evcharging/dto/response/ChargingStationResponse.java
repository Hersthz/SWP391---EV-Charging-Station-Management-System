package com.pham.basis.evcharging.dto.response;


import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChargingStationResponse {
    private Long id;
    private String name;
    private String address;
    private String status;
    private Long managerId;
}

