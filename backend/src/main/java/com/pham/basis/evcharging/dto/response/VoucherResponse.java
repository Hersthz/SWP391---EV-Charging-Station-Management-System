package com.pham.basis.evcharging.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoucherResponse {
    private Long id;
    private String code;
    private Integer discountPercent;
    private Double discountAmount;
    private Integer maxUses;
    private Integer usedCount;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
}
