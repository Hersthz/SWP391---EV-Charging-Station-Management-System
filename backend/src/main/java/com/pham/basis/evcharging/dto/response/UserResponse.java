package com.pham.basis.evcharging.dto.response;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
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
    private String url;
}
