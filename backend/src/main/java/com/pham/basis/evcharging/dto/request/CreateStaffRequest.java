package com.pham.basis.evcharging.dto.request;

import lombok.Data;

@Data
public class CreateStaffRequest {
    private String full_name;
    private String username;
    private String password;
    private String email;
    private String phone;
    private int roleId;
}
