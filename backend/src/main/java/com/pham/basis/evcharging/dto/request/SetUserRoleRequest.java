package com.pham.basis.evcharging.dto.request;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor

public class SetUserRoleRequest {
    private String username;
    private String roleName;
    private boolean keepUserBaseRole;
}
