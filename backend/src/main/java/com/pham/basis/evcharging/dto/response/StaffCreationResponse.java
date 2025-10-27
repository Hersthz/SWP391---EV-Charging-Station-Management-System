package com.pham.basis.evcharging.dto.response;

import lombok.*;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffCreationResponse {
    private Long user_id;
    private String full_name;
    private String username;
    private String email;
    private String phone;
    private Integer roleCode;
    private String message;
    private String tempPassword; // chỉ dùng nếu cần thông báo mật khẩu tạm
}

