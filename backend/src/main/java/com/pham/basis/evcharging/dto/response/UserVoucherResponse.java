package com.pham.basis.evcharging.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @AllArgsConstructor @Builder
public class UserVoucherResponse {
    private String code;
    private String description;
    private double discountAmount;
    private LocalDateTime redeemedAt;
    private boolean used;
}
