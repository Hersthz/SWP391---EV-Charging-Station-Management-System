package com.pham.basis.evcharging.dto.request;

import lombok.Data;

import java.time.LocalDate;

@Data
public class VoucherRequest {
    private String code;
    private Double discountAmount;
    private int requiredPoints;
    private String discountType;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private int quantity;
    private String status; // "ACTIVE", "INACTIVE", "EXPIRED"
}
