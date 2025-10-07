package com.pham.basis.evcharging.dto.request;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class UserCreationRequest {
    private String full_name;
    private String username;
    private String email;
    private String password;
    private String phone;
}