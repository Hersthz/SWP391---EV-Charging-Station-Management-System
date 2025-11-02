package com.pham.basis.evcharging.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter @Setter
public class StationReviewResponse {
    private Long id;
    private Long stationId;
    private Long userId;
    private int rating;
    private String comment;
    private LocalDateTime createdAt;
}
