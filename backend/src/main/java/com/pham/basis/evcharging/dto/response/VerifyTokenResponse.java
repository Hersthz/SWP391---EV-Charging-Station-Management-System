package com.pham.basis.evcharging.dto.response;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerifyTokenResponse {
    private Long reservationId;
    private Long userId;
    private String newStatus;
}
