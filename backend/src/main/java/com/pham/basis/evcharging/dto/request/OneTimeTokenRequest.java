package com.pham.basis.evcharging.dto.request;

import lombok.Data;

@Data
public class OneTimeTokenRequest {
    private Long userId;
    private Long reservationId;
}
