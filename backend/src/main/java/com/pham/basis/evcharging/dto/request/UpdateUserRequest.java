package com.pham.basis.evcharging.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateUserRequest {
    private String full_name;
    private String phone;
    private LocalDate date_of_birth;
}
