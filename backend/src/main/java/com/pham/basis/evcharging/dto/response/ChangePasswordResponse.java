package com.pham.basis.evcharging.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ChangePasswordResponse {
    private boolean success;
    private String message;
}
