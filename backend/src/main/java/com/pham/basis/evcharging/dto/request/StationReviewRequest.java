package com.pham.basis.evcharging.dto.request;



import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class StationReviewRequest {

    @NotNull(message = "Station is required")
    @Positive(message = "Station id must be a positive number")
    private Long stationId;

    @NotNull(message = "User id is required")
    @Positive(message = "User id must be a positive number")
    private Long userId;

    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be between 1 and 5")
    @Max(value = 5, message = "Rating must be between 1 and 5")
    private Integer rating;

    @NotBlank(message = "Comment is required")
    @Size(min = 1, max = 200, message = "Comment must be between 1 and 200 characters")
    private String comment;
}
