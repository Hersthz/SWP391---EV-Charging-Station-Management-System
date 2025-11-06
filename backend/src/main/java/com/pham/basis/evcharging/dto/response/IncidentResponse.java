package com.pham.basis.evcharging.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class IncidentResponse {
    public Long id;
    public String title;
    public Long stationId;
    public String stationName;
    public Long pillarId;
    public String priority;
    public String status;
    public String description;
    public String reportedBy;
    public Long reportedById;
    public LocalDateTime reportedTime;
}
