package com.pham.basis.evcharging.dto.request;

import lombok.Data;

@Data
public class OneTimeTokenVerifyRequest {
    private String token;
    private Long userId;
}
