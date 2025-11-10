package com.pham.basis.evcharging.dto.request;



import jakarta.validation.constraints.*;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

public class VehicleRequest {

    @NotBlank(message = "Make is required")
    private String make;

    @NotBlank(message = "Model is required")
    private String model;

    @NotNull(message = "Current SOC is required")
    private Double currentSoc;

    @NotNull(message = "Battery capacity is required")
    @DecimalMin(value = "5.0", message = "Battery capacity must be >= 5 kWh")
    @DecimalMax(value = "200.0", message = "Battery capacity must be <= 200 kWh")
    private Double batteryCapacityKwh;

    @DecimalMin(value = "3.0", message = "AC power must be >= 3 kW")
    @DecimalMax(value = "22.0", message = "AC power must be <= 22 kW")
    private Double acMaxKw;

    @DecimalMin(value = "20.0", message = "DC power must be >= 20 kW")
    @DecimalMax(value = "350.0", message = "DC power must be <= 350 kW")
    private Double dcMaxKw;
}

