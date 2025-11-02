package com.pham.basis.evcharging.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffAnalyticsResponse {

    private Long totalSessions;
    private Double totalEnergyKwh;
    private BigDecimal totalRevenue;
    private List<HourlyUsage> hourlyUsage; // thống kê 0–23 giờ hôm nay

    @Getter @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HourlyUsage {
        private Integer hour;
        private Integer sessionCount;
        private Double energyKwh;
    }
}