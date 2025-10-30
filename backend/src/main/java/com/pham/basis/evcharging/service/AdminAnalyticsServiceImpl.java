    package com.pham.basis.evcharging.service;

    import com.pham.basis.evcharging.dto.response.AdminAnalyticsResponse;
    import com.pham.basis.evcharging.exception.AppException;
    import com.pham.basis.evcharging.model.ChargingSession;
    import com.pham.basis.evcharging.model.ChargingStation;
    import com.pham.basis.evcharging.model.User;
    import com.pham.basis.evcharging.repository.ChargingSessionRepository;
    import com.pham.basis.evcharging.repository.ChargingStationRepository;
    import com.pham.basis.evcharging.repository.PaymentTransactionRepository;
    import com.pham.basis.evcharging.repository.UserRepository;
    import lombok.RequiredArgsConstructor;
    import org.springframework.stereotype.Service;
    import org.springframework.transaction.annotation.Transactional;

    import java.math.BigDecimal;
    import java.time.YearMonth;
    import java.util.Comparator;
    import java.util.List;
    import java.util.stream.Collectors;
    import java.util.stream.IntStream;

    @Service
    @RequiredArgsConstructor
    @Transactional(readOnly = true)
    public class AdminAnalyticsServiceImpl implements AdminAnalyticsService {
        private final UserRepository userRepository;
        private final ChargingStationRepository chargingStationRepository;
        private final ChargingSessionRepository  chargingSessionRepository;
        private final PaymentTransactionRepository paymentTransactionRepository;

        @Override
        public AdminAnalyticsResponse getAdminAnalytics(Long userId){
            //load
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new AppException.NotFoundException("Admin not found"));

            if(!"ADMIN".equals(user.getRole().getName())){
                throw new AppException.BadRequestException("Only Admin can view this");
            }
            //
            Long totalUsers = userRepository.findAll().stream()
                    .filter(u -> "USER".equals(u.getRole().getName()))
                    .count();
            Long totalStations = chargingStationRepository.count();

            Double totalEnergyKwh = chargingSessionRepository.sumTotalEnergy();

            BigDecimal totalRevenue = paymentTransactionRepository.sumAll();

            YearMonth currentMonth = YearMonth.now();
            List<AdminAnalyticsResponse.MonthlyRevenue> monthlyRevenue = IntStream.range(0, 6)
                    .mapToObj(i-> {YearMonth ym = currentMonth.minusMonths(i);
                        BigDecimal revenue = paymentTransactionRepository.sumRevenueByMonth(ym.getYear(), ym.getMonthValue());
                        return AdminAnalyticsResponse.MonthlyRevenue.builder()
                                .revenue(revenue)
                                .month(ym.toString())
                                .build();
                    })
                    .collect(Collectors.toList());
            //
            List<ChargingStation> stations = chargingStationRepository.findAll();
            List<AdminAnalyticsResponse.StationRevenue> revenueStation = stations.stream()
                    .map(st -> {
                        BigDecimal revenue = paymentTransactionRepository.sumRevenueByStation(st.getId());
                        BigDecimal energy = chargingSessionRepository.sumEnergyByStation(st.getId());

                        return AdminAnalyticsResponse.StationRevenue.builder()
                                .stationId(st.getId())
                                .revenue(revenue)
                                .energyKwh(energy.doubleValue())
                                .stationName(st.getName())
                                .build();
                    })
                    .sorted(Comparator.comparing(AdminAnalyticsResponse.StationRevenue::getRevenue).reversed())
                    .toList();
            //
            List<ChargingSession> sessions = chargingSessionRepository.findAll();
            var sessionsByHour = sessions.stream()
                    .filter(s -> s.getStartTime() != null)
                    .collect(Collectors.groupingBy(s -> s.getStartTime().getHour()));

            List<AdminAnalyticsResponse.PeakHour> peakHour = IntStream.range(0, 24)
                    .mapToObj(hour -> {
                        int count = sessionsByHour.getOrDefault(hour, List.of()).size();
                        return AdminAnalyticsResponse.PeakHour.builder()
                                .hour(hour)
                                .sessionCount(count)
                                .build();
                    })
                    .toList();
            //
            return AdminAnalyticsResponse.builder()
                    .totalUsers(totalUsers)
                    .totalStations(totalStations)
                    .totalEnergyKwh(totalEnergyKwh)
                    .totalRevenue(totalRevenue)
                    .revenue6Months(monthlyRevenue)
                    .revenueByStation(revenueStation)
                    .peakHour(peakHour)
                    .build();
        }


    }
