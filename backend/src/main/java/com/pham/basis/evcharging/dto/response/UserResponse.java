package com.pham.basis.evcharging.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserResponse {
    private Integer user_id;
    private String full_name;
    private String username;
    private String email;
    private String phone;
    private String roleName;
}
