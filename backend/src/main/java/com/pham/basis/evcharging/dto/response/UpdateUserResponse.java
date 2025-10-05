package com.pham.basis.evcharging.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UpdateUserResponse {
    private boolean success;
    private String message;
    private UserResponse data;

}