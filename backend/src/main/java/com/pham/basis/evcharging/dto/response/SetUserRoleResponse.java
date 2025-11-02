package com.pham.basis.evcharging.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SetUserRoleResponse {
    private String username;
    private String roleName;
    private boolean keepUserBaseRole;
}
