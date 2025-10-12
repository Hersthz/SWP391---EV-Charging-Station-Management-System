package com.pham.basis.evcharging.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignManagerRequest {
    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Station ID is required")
    private Long stationId;

}
