package com.pham.basis.evcharging.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class VoucherApplyResponse {
    private String message;
    private double discountValue;
    private double finalPrice;
}
