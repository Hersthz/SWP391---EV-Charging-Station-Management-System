package com.pham.basis.evcharging.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class KycStatusResponse {
    private String status; // "PENDING" | "APPROVED" | "REJECTED"
}