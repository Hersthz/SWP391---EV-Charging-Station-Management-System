package com.pham.basis.evcharging.dto.response;

import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CreateStaffResponse {
    private Long user_id;
    private String full_name;
    private String username;
    private String email;
    private String phone;
    private int roleCode;
    private String subscriptionName;

}
