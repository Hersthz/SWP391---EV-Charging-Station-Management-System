package com.pham.basis.evcharging.dto.response;

import lombok.*;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAnalyticsResponse {
    private long totalSessions;
    private double totalEnergyKwh;
    private double totalCost;
    private List<Map<String, Object>> monthlyCost;
    private List<Map<String, Object>> topStations;
    private List<Map<String, Object>> connectorUsage;
}
