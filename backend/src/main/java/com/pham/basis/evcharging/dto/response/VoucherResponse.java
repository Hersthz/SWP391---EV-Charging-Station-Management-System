
package com.pham.basis.evcharging.dto.response;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class VoucherResponse {
    private Long voucherId;
    private String code;
    private String description;
    private Double discountAmount;
    private String discountType;
    private int requiredPoints;
    private LocalDate startDate;  // thêm
    private LocalDate endDate;    // thêm
    private int quantity;
    private String status;
}