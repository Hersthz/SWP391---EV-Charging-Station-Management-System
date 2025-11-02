package com.pham.basis.evcharging.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignManagerRequest {
    @NotNull(message = "User ID is required")
    @Min(value = 1, message = "User ID must be greater than 0")
    private Long userId;

    @NotNull(message = "Station ID is required")
    @Min(value = 1, message = "Station ID must be greater than 0")
    private Long stationId;

}
