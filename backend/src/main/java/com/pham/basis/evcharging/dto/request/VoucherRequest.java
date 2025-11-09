package com.pham.basis.evcharging.dto.request;

import lombok.Data;

import java.time.LocalDate;

@Data
public class VoucherRequest {
    private String code;
    private Double discountAmount;
    private int requiredPoints;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status; // "ACTIVE", "INACTIVE", "EXPIRED"
}
