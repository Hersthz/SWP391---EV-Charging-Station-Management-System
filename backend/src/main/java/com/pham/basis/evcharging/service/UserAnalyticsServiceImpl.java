package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.response.UserAnalyticsResponse;
import com.pham.basis.evcharging.exception.AppException;
import com.pham.basis.evcharging.model.ChargingSession;
import com.pham.basis.evcharging.model.ChargingStation;
import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserAnalyticsServiceImpl implements  UserAnalyticsService {

    private final ChargingSessionRepository chargingSessionRepository;
    private final ReservationRepository reservationRepository;
    private final ChargingStationRepository chargingStationRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final ConnectorRepository connectorRepository;
    private final UserRepository userRepository;

    @Override
    public UserAnalyticsResponse getUserAnalytics(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(()-> new AppException.NotFoundException("No user found"));
        //
        List<ChargingSession> sessions = chargingSessionRepository.findByDriverId(user.getId());
        //
        Long totalSessions = chargingSessionRepository.countByDriverId(user.getId());
        double getTotalEnergy = sessions.stream()
                .map(s-> s.getEnergyCount() != null ? s.getEnergyCount(): BigDecimal.ZERO)
                .mapToDouble(BigDecimal::doubleValue)
                .sum();
        Double totalEnergy = roundDouble(getTotalEnergy,2);
        //
        BigDecimal totalCost = Optional.ofNullable(
                paymentTransactionRepository.sumSpendingExcludingVnpayWallet(user.getId())
        ).orElse(BigDecimal.ZERO);
        //
        Double averageSessionDuration = (double) Math.round(sessions.stream()
                .filter(s-> s.getStartTime() != null && s.getEndTime() != null)
                .mapToDouble(s-> Duration.between(s.getStartTime(),s.getEndTime()).toMinutes())
                .average()
                .orElse(0.0));
        //
        Double avgCostPerKwh = totalEnergy > 0
                ? totalCost.divide(BigDecimal.valueOf(totalEnergy), 2, RoundingMode.HALF_UP).doubleValue()
                : 0.0;
        //
        YearMonth currentMonth = YearMonth.now();
        YearMonth previousMonth = currentMonth.minusMonths(1);

        BigDecimal currentMonthCost = paymentTransactionRepository.sumSpendingByUserAndMonth(user.getId(),currentMonth.getYear(),currentMonth.getMonthValue());
        BigDecimal previousMonthCost = paymentTransactionRepository.sumSpendingByUserAndMonth(user.getId(),previousMonth.getYear(),previousMonth.getMonthValue());

        Double percentChangeCost = 0.0;
        if (previousMonthCost.compareTo(BigDecimal.ZERO) > 0) {
            percentChangeCost = currentMonthCost
                    .subtract(previousMonthCost)
                    .divide(previousMonthCost, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
        }

        //
        UserAnalyticsResponse.AnalyticsOverview analyticsOverview = UserAnalyticsResponse.AnalyticsOverview.builder()
                .totalSessions(totalSessions)
                .totalEnergyKwh(totalEnergy)
                .totalCost(totalCost)
                .averageSessionDuration(averageSessionDuration)
                .avgCostPerKwh(avgCostPerKwh)
                .percentChangeCost(percentChangeCost)
                .build();
        //
        List<UserAnalyticsResponse.MonthlyAnalytics> monthlyAnalytics = IntStream.range(0, 5)
                .mapToObj(i-> {
                    YearMonth yearMonth = currentMonth.minusMonths(i);
                    return UserAnalyticsResponse.MonthlyAnalytics.builder()
                            .yearMonth(yearMonth)
                            .cost(paymentTransactionRepository.sumSpendingByUserAndMonth(user.getId(),yearMonth.getYear(),yearMonth.getMonthValue()))
                            .energyKwh(calculateMonthlyEnergy(sessions,yearMonth))
                            .sessionCount(countMonthlySessions(sessions,yearMonth))
                            .averageDuration(calculateMonthlyAverageDuration(sessions,yearMonth))
                            .build();
                })
                .collect(Collectors.toList());
        //
        Map<Long, List<ChargingSession>> sessionsByStation = groupSessionsByStation(sessions);
        List<UserAnalyticsResponse.StationAnalytics> topStations = buildTopStations(sessionsByStation);
        //
        List<UserAnalyticsResponse.ConnectorAnalytics> connectorAnalytics = buildConnectorAnalytics(sessions);
        List<UserAnalyticsResponse.HourlyUsage> hourlyUsage = buildHourlyUsage(sessions);
        //
        return UserAnalyticsResponse.builder()
                .overview(analyticsOverview)
                .monthlyTrends(monthlyAnalytics)
                .topStations(topStations)
                .connectorUsage(connectorAnalytics)
                .hourlyUsage(hourlyUsage)
                .build();
    }

    //Station
    private List<UserAnalyticsResponse.StationAnalytics> buildTopStations(
            Map<Long, List<ChargingSession>> sessionsByStation
    ) {
        double totalEnergyAllStations = sessionsByStation.values().stream()
                .mapToDouble(this::sumEnergy)
                .sum();
        List<UserAnalyticsResponse.StationAnalytics> stationAnalytics = sessionsByStation.values().stream()
                .map(stationSessions -> {
                    ChargingStation station = stationSessions.get(0).getStation();

                    double totalEnergy = sumEnergy(stationSessions);

                    BigDecimal totalCost = stationSessions.stream()
                            .map(s -> Optional.ofNullable(s.getChargedAmount()).orElse(BigDecimal.ZERO))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    double usagePercent = totalEnergyAllStations > 0
                            ? (totalEnergy / totalEnergyAllStations) * 100
                            : 0.0;

                    return UserAnalyticsResponse.StationAnalytics.builder()
                            .stationId(String.valueOf(station.getId()))
                            .stationName(station.getName())
                            .address(station.getAddress())
                            .sessionCount(stationSessions.size())
                            .totalEnergyKwh(roundDouble(totalEnergy, 2))
                            .totalCost(totalCost)
                            .usagePercentage(roundDouble(usagePercent, 2))
                            .lat(station.getLatitude())
                            .lng(station.getLongitude())
                            .build();
                })
                .sorted(Comparator.comparing(UserAnalyticsResponse.StationAnalytics::getSessionCount).reversed())
                .limit(3)
                .collect(Collectors.toList());

        AtomicInteger rankCounter = new AtomicInteger(1);
        stationAnalytics.forEach(s -> s.setRank(rankCounter.getAndIncrement()));
        return stationAnalytics;
    }

    //Connector
    private List<UserAnalyticsResponse.ConnectorAnalytics> buildConnectorAnalytics(List<ChargingSession> sessions) {
        Map<String, List<ChargingSession>> sessionsByConnector = groupSessionsByConnectorType(sessions);

        double totalEnergyAllConnectors = sumEnergy(sessions);

        return sessionsByConnector.entrySet().stream()
                .map(entry -> {
                    String connectorType = entry.getKey();
                    List<ChargingSession> connectorSessions = entry.getValue();

                    double totalEnergy = sumEnergy(connectorSessions);

                    double usagePercent = totalEnergyAllConnectors > 0
                            ? (totalEnergy / totalEnergyAllConnectors) * 100
                            : 0.0;

                    return UserAnalyticsResponse.ConnectorAnalytics.builder()
                            .connectorType(connectorType)
                            .sessionCount(connectorSessions.size())
                            .totalEnergyKwh(roundDouble(totalEnergy, 2))
                            .usagePercentage(roundDouble(usagePercent, 2))
                            .build();

                })
                .sorted(Comparator.comparing(UserAnalyticsResponse.ConnectorAnalytics::getTotalEnergyKwh).reversed())
                .collect(Collectors.toList());
    }
    //Hourly
    private List<UserAnalyticsResponse.HourlyUsage> buildHourlyUsage(List<ChargingSession> sessions) {
        Map<Integer, List<ChargingSession>> sessionsByHour = groupSessionsByHour(sessions);

        // Duyệt qua tất cả 24 giờ để đảm bảo không bỏ trống giờ nào
        return IntStream.range(0, 24)
                .mapToObj(hour -> {
                    List<ChargingSession> hourSessions = sessionsByHour.getOrDefault(hour, List.of());

                    return UserAnalyticsResponse.HourlyUsage.builder()
                            .hour(hour)
                            .sessionCount(hourSessions.size())
                            .build();
                })
                .collect(Collectors.toList());
    }

    //-----Helpers---------
    private static Double roundDouble(double value, int places) {
        if (places < 0) throw new IllegalArgumentException();
        return BigDecimal.valueOf(value)
                .setScale(places, RoundingMode.HALF_UP)
                .doubleValue();
    }
    //tinh e theo thang
    private double calculateMonthlyEnergy(List<ChargingSession> sessions, YearMonth yearMonth) {
        return roundDouble(
                sessions.stream()
                        .filter(s -> s.getStartTime() != null
                                && YearMonth.from(s.getStartTime()).equals(yearMonth))
                        .map(s -> s.getEnergyCount() != null ? s.getEnergyCount() : BigDecimal.ZERO)
                        .mapToDouble(BigDecimal::doubleValue)
                        .sum(),
                2
        );
    }
    //count session theo thang
    private int countMonthlySessions(List<ChargingSession> sessions, YearMonth yearMonth) {
        return (int) sessions.stream()
                .filter(s -> s.getStartTime() != null
                        && YearMonth.from(s.getStartTime()).equals(yearMonth))
                .count();
    }
    //tinh minutes theo thang
    private double calculateMonthlyAverageDuration(List<ChargingSession> sessions, YearMonth yearMonth) {
        return roundDouble(
                sessions.stream()
                        .filter(s -> s.getStartTime() != null && s.getEndTime() != null)
                        .filter(s -> YearMonth.from(s.getStartTime()).equals(yearMonth))
                        .mapToDouble(s -> Duration.between(s.getStartTime(), s.getEndTime()).toMinutes())
                        .average()
                        .orElse(0.0),
                2
        );
    }

    //gom session theo station
    private Map<Long, List<ChargingSession>> groupSessionsByStation(List<ChargingSession> sessions) {
        return sessions.stream()
                .filter(s -> s.getStation() != null)
                .collect(Collectors.groupingBy(s -> s.getStation().getId()));
    }
    //gom session theo connector type
    private Map<String, List<ChargingSession>> groupSessionsByConnectorType(List<ChargingSession> sessions) {
        return sessions.stream()
                .filter(s -> s.getReservation() != null)
                .filter(s -> s.getReservation().getConnector() != null)
                .filter(s -> s.getReservation().getConnector().getType() != null)
                .collect(Collectors.groupingBy(
                        s -> s.getReservation().getConnector().getType()
                ));
    }
    //gom session theo giờ
    private Map<Integer, List<ChargingSession>> groupSessionsByHour(List<ChargingSession> sessions) {
        return sessions.stream()
                .filter(s -> s.getStartTime() != null)
                .collect(Collectors.groupingBy(
                        s -> s.getStartTime().getHour()  // 0–23
                ));
    }
    //
    private double sumEnergy(List<ChargingSession> sessions) {
        return sessions.stream()
                .map(s -> s.getEnergyCount() != null ? s.getEnergyCount() : BigDecimal.ZERO)
                .mapToDouble(BigDecimal::doubleValue)
                .sum();
    }
}
