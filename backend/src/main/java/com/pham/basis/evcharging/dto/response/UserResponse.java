package com.pham.basis.evcharging.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserResponse {
    private Long id;
    private String fullName;
    private String username;
    private String email;
    private String phone;
    private Boolean status;
    private Boolean isVerified;
    private String roleName;
    private LocalDate dateOfBirth;
    private LocalDateTime createdAt;
}
