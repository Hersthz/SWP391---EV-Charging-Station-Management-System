package com.pham.basis.evcharging.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class KycStatusResponse {
    private String status; // "PENDING" | "APPROVED" | "REJECTED"
}