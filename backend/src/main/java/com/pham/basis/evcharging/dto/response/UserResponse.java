package com.pham.basis.evcharging.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserResponse {
    private Long user_id;
    private String full_name;
    private String username;
    private String email;
    private String phone;
    private int roleId;

}
