package com.pham.basis.evcharging.dto.request;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
public class IncidentRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotBlank(message = "Priority is required")
    private String priority;

    @NotNull(message = "Station ID is required")
    private Long stationId;

    private Long pillarId;

    @NotNull(message = "Reporter ID is required")
    private Long reportedById;
}
