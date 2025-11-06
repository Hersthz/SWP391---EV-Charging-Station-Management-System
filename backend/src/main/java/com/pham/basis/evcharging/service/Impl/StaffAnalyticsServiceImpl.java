package com.pham.basis.evcharging.service.Impl;

import com.pham.basis.evcharging.dto.response.StaffAnalyticsResponse;
import com.pham.basis.evcharging.exception.AppException;
import com.pham.basis.evcharging.model.ChargingStation;
import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.repository.ChargingStationRepository;
import com.pham.basis.evcharging.repository.UserRepository;
import com.pham.basis.evcharging.service.StaffAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class StaffAnalyticsServiceImpl implements StaffAnalyticsService {
    private final UserRepository userRepository;
    private final ChargingStationRepository chargingStationRepository;

    @Override
    public StaffAnalyticsResponse getStaffAnalytics(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException.NotFoundException("Staff not found"));
        if(!"STAFF".equals(user.getRole().getName())){
            throw new AppException.BadRequestException("Only staff can view this");
        }

        ChargingStation chargingStation = chargingStationRepository.findByManagerId(user.getId())
                .orElseThrow(() -> new AppException.NotFoundException("Charging Station not found"));

        var sessions = chargingStation.getSessions();

        Long totalSession = (long) sessions.size();
        double totalEnergy = sessions.stream()
                .filter(s -> s.getEnergyCount() != null)
                .mapToDouble(s -> s.getEnergyCount().doubleValue())
                .sum();
        BigDecimal totalRevenue = sessions.stream()
                .filter(s -> s.getChargedAmount() != null)
                .map(s -> s.getChargedAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        var sessionsByHour = sessions.stream()
                .filter(s -> s.getStartTime() != null)
                .collect(Collectors.groupingBy(s -> s.getStartTime().getHour()));
        List<StaffAnalyticsResponse.HourlyUsage> hourly = IntStream.range(0, 24)
                .mapToObj(hour -> {
                    int count = sessionsByHour.getOrDefault(hour, List.of()).size();
                    return StaffAnalyticsResponse.HourlyUsage.builder()
                            .hour(hour)
                            .sessionCount(count)
                            .build();
                }).toList();

        return StaffAnalyticsResponse.builder()
                .totalSessions(totalSession)
                .totalEnergyKwh(totalEnergy)
                .totalRevenue(totalRevenue)
                .hourlyUsage(hourly)
                .build();
    }
}
