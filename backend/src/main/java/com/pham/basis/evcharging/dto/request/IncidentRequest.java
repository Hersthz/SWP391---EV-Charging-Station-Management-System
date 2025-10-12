package com.pham.basis.evcharging.dto.request;

import lombok.Data;

@Data
public class IncidentRequest {
        private String title;
        private String description;
        private String priority;
        private Long stationId;
        private Long pillarId;
        private Long reportedById;
}
