package com.pham.basis.evcharging.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserVoucherResponse {
    private String voucherCode;
    private Integer discountPercent;
    private Double discountAmount;
    private String status;
    private boolean used;
    private LocalDateTime usedAt;
}
