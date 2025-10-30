package com.pham.basis.evcharging.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminAnalyticsResponse {

    private Long totalUsers;
    private Long totalStations;
    private Double totalEnergyKwh;
    private BigDecimal totalRevenue;

    private List<MonthlyRevenue> revenue6Months;
    private List<StationRevenue> revenueByStation;
    private List<PeakHour> peakHour;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MonthlyRevenue {
        private String month; // yyyy-MM
        private BigDecimal revenue;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StationRevenue {
        private Long stationId;
        private String stationName;
        private BigDecimal revenue;
        private Double energyKwh;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PeakHour {
        private Integer hour;
        private Integer sessionCount;
    }
}
