package com.pham.basis.evcharging.dto.request;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VoucherApplyRequest {
    private Long userId;
    private String code;
    private Double totalAmount;

}
