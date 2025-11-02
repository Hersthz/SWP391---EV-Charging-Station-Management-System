package com.pham.basis.evcharging.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class LoginResponse {
    private String username;
    private String role;
    private String full_name;
    private Long id;
}
