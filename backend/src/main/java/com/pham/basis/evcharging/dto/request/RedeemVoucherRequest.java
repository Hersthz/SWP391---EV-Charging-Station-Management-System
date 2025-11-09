package com.pham.basis.evcharging.dto.request;

import lombok.*;

@Getter @Setter
public class RedeemVoucherRequest {
    private Long userId;
    private Long voucherId;
}
