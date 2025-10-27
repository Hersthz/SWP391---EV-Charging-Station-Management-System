package com.pham.basis.evcharging.dto.request;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StaffCreationRequest {
    private String full_name;
    private String username;
    private String email;
    private String password;
    private String phone;
    private Integer roleId; // thêm để gán ROLE_STAFF khi tạo
}
