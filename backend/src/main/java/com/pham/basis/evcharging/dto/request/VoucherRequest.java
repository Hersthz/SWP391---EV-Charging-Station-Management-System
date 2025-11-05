package com.pham.basis.evcharging.dto.request;

import lombok.Data;

import java.time.LocalDate;

@Data
public class VoucherRequest {
    private String code;
    private Integer discountPercent;
    private Double discountAmount;
    private Integer maxUses;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status; // "ACTIVE", "INACTIVE", "EXPIRED"
}
