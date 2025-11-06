package com.pham.basis.evcharging.dto.response;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UpdateUserResponse {
    private String fullName;
    private String email;
    private String phone;
    private LocalDate dateOfBirth;
    private String url;
}