package com.pham.basis.evcharging.dto.response;

import lombok.*;

@Getter @Setter @AllArgsConstructor @Builder
public class VoucherResponse {
    private Long voucherId;
    private String code;
    private String description;
    private double discountAmount;
    private String discountType;
    private int requiredPoints;
}
