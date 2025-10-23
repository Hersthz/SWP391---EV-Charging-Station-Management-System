package com.pham.basis.evcharging.dto.request;


import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdjustTargetSocRequest {
    @NotNull(message = "Target SOC is required")
    private Double targetSoc;
}
