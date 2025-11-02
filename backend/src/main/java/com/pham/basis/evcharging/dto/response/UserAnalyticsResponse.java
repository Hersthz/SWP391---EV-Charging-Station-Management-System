package com.pham.basis.evcharging.dto.response;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAnalyticsResponse {

    private AnalyticsOverview overview;
    private List<MonthlyAnalytics> monthlyTrends;   // thống kê theo tháng (6–12 tháng gần nhất)
    private List<StationAnalytics> topStations;     // 3 trạm dùng nhiều nhất
    private List<ConnectorAnalytics> connectorUsage; // thống kê connector type
    private List<HourlyUsage> hourlyUsage;          // thống kê theo giờ (0–23)

    @Getter @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AnalyticsOverview {
        private Long totalSessions;
        private Double totalEnergyKwh;
        private BigDecimal totalCost;
        private Double averageSessionDuration; // phút
        private Double avgCostPerKwh;          // VND/kWh
        private Double percentChangeCost;      // % so với tháng trước
    }

    @Getter @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MonthlyAnalytics {
        @JsonFormat(pattern = "yyyy-MM")
        private YearMonth yearMonth;
        private BigDecimal cost;
        private Double energyKwh;
        private Integer sessionCount;
        private Double averageDuration;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StationAnalytics {
        private String stationId;
        private String stationName;
        private String address;
        private Integer sessionCount;
        private Double totalEnergyKwh;
        private BigDecimal totalCost;
        private Double usagePercentage; // % tổng lượng sử dụng
        private Double lat;
        private Double lng;
        private Integer rank;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ConnectorAnalytics {
        private String connectorType;
        private Integer sessionCount;
        private Double totalEnergyKwh;
        private Double usagePercentage;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HourlyUsage {
        private Integer hour;          // 0–23
        private Integer sessionCount;
    }
}
