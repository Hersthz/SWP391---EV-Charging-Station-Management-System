package com.pham.basis.evcharging.dto.request;

import lombok.Data;

@Data
public class VoucherApplyRequest {
    private Long userId;
    private String code;
    private Double totalAmount;
}
