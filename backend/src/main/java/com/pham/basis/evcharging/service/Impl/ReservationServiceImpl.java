package com.pham.basis.evcharging.service.Impl;

import com.pham.basis.evcharging.dto.request.ReservationRequest;
import com.pham.basis.evcharging.dto.response.ReservationResponse;
import com.pham.basis.evcharging.exception.AppException;
import com.pham.basis.evcharging.model.*;
import com.pham.basis.evcharging.repository.*;
import com.pham.basis.evcharging.service.NotificationService;
import com.pham.basis.evcharging.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class ReservationServiceImpl implements ReservationService {
    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final ChargingStationRepository chargingStationRepository;
    private final ChargerPillarRepository chargerPillarRepository;
    private final ConnectorRepository connectorRepository;
    private final VehicleRepository vehicleRepository;
    private final WalletRepository walletRepository;
    private final NotificationService notificationService;

    private static final long GRACE_MINUTES = 15;
    private static final BigDecimal HOLD_FEE_PER_MINUTE = BigDecimal.valueOf(300);

    @Override
    public ReservationResponse createReservation(ReservationRequest request) {

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new AppException.BadRequestException("User not found"));
        ChargingStation chargingStation = chargingStationRepository.findById(request.getStationId())
                .orElseThrow(() -> new AppException.BadRequestException("Station not found"));
        ChargerPillar chargerPillar = chargerPillarRepository.findChargerPillarById(request.getPillarId())
                .orElseThrow(() -> new AppException.BadRequestException("Pillar not found"));
        Connector connector = connectorRepository.findById(request.getConnectorId())
                .orElseThrow(() -> new AppException.BadRequestException("Connector not found"));
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new AppException.BadRequestException("Vehicle not found"));

        if (!vehicle.getUser().getId().equals(user.getId())) {
            throw new AppException.BadRequestException("Vehicle does not belong to this user");
        }

        // kieem tra có đúng pillar ko
        if(!connector.getPillar().getId().equals(chargerPillar.getId())){
            throw new AppException.BadRequestException("Connector does not belong to the selected pillar");
        }
        //validate time
        validateTime(request);

        //kiểm tra chồng reservation
        checkForOverlappingReservations(request);

        // check vehicle overlapping
        checkVehicleOverlappingReservations(request);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiredAt = request.getEndTime().plusMinutes(10);

        //tinhs holdFee 300d/p
        long minutes = ChronoUnit.MINUTES.between(request.getStartTime(), request.getEndTime());
        BigDecimal holdFee = BigDecimal.valueOf(minutes).multiply(HOLD_FEE_PER_MINUTE);

        //lưu db với status pending
        Reservation reservation = Reservation.builder()
                .user(user)
                .vehicle(vehicle)
                .station(chargingStation)
                .pillar(chargerPillar)
                .connector(connector)
                .status("PENDING")
                .holdFee(holdFee)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .createdAt(now)
                .expiredAt(expiredAt)
                .build();
        Reservation saved = reservationRepository.save(reservation);

        //trả về theo response
        return toResponse(saved);
    }

    @Override
    public List<ReservationResponse> getReservationsByUser(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Reservation> reservations = reservationRepository
                .findByUserIdOrderByCreatedAtDesc(userId);

        return reservations.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ReservationResponse updateStatus(Long reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new AppException.BadRequestException("Reservation not found"));
        reservation.setStatus("PLUGGED");
        Reservation saved = reservationRepository.save(reservation);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void cancel(Long id, User user) {
        Reservation reservation = reservationRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new AppException.BadRequestException("Reservation not found"));

        if (!reservation.getStatus().equals("SCHEDULED")) {
            throw new AppException.BadRequestException("Reservation cannot be cancelled");
        }

        // Giới hạn số lần cancel trong ngày
        LocalDate today = LocalDate.now();
        long cancelCountToday = reservationRepository.countByUserIdAndStatusAndExpiredAtBetween(
                user.getId(),
                "CANCELLED",
                today.atStartOfDay(),
                today.plusDays(1).atStartOfDay()
        );

        if (cancelCountToday >= 3) {
            throw new AppException.BadRequestException("You have reached the maximum of 3 cancellations today");
        }

        LocalDateTime now = LocalDateTime.now();
        Duration diff = Duration.between(reservation.getCreatedAt(), now);
        long minutes = diff.toMinutes();

        BigDecimal refundAmount = BigDecimal.ZERO;
        BigDecimal systemEarn = BigDecimal.ZERO;
        BigDecimal paid = reservation.getHoldFee();

        if (minutes <= 10) {
            refundAmount = paid;                  // 100%
            systemEarn = BigDecimal.ZERO;
        } else if (minutes <= 60) {
            refundAmount = paid.multiply(BigDecimal.valueOf(0.5)); // 50%
            systemEarn = paid.subtract(refundAmount);
        } else {
            refundAmount = BigDecimal.ZERO;                  // 0%
            systemEarn = paid;
        }

        // Handle refund (service call)
        if (refundAmount.compareTo(BigDecimal.ZERO) > 0) {
            walletRepository.addBalance(user.getId(), refundAmount);
        }

        reservation.setStatus("CANCELLED");
        reservation.setHoldFee(systemEarn);
        reservation.setExpiredAt(now);
        reservationRepository.save(reservation);
    }

    @Override
    public List<ReservationResponse> getReservationByStation(Long stationId) {
        chargingStationRepository.findById(stationId)
                .orElseThrow(() -> new AppException.BadRequestException("Station not found"));

        List<Reservation> reservations = reservationRepository
                .findByStationIdOrderByCreatedAtDesc(stationId);

        return reservations.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private ReservationResponse toResponse(Reservation saved) {
        return ReservationResponse.builder()
                .reservationId(saved.getId())
                .vehicleId(saved.getVehicle().getId())
                .stationId(saved.getStation().getId())
                .stationName(saved.getStation().getName())
                .pillarId(saved.getPillar().getId())
                .connectorId(saved.getConnector().getId())
                .status(saved.getStatus())
                .holdFee(saved.getHoldFee())
                .startTime(saved.getStartTime())
                .endTime(saved.getEndTime())
                .createdAt(saved.getCreatedAt())
                .expiredAt(saved.getExpiredAt())
                .build();
    }

    private void validateTime(ReservationRequest req){
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = LocalDate.now();
        LocalDate maxDateAllowed = today.plusDays(7);

        //kiem tra end va start time
        if (!req.getEndTime().isAfter(req.getStartTime())) throw new AppException.BadRequestException("End time must be after start time");

            if (!req.getStartTime().isAfter(now)) throw new AppException.BadRequestException("Start time must be after current time");

        if (req.getStartTime().toLocalDate().isAfter(maxDateAllowed) ||
                req.getEndTime().toLocalDate().isAfter(maxDateAllowed)) {
            throw new AppException.BadRequestException("Reservations can only be made within 7 days from today");
        }

    }

    private void checkForOverlappingReservations(ReservationRequest req) {
        List<Reservation> existingReservations = reservationRepository
                .findOverlappingReservations(
                        req.getConnectorId(),
                        req.getStartTime(),
                        req.getEndTime().plusMinutes(10)
                );

        if (!existingReservations.isEmpty()) {
            Reservation conflict = existingReservations.get(0);
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
            String start = conflict.getStartTime().format(timeFormatter);
            String end = conflict.getEndTime().format(timeFormatter);

            throw new AppException.BadRequestException(String.format(
                    "Pillar %d (Connector %s) is already booked from %s to %s",
                    req.getPillarId(),
                    connectorRepository.findById(req.getConnectorId()).get().getType(),
                    start,
                    end
            ));
        }
    }
    private void checkVehicleOverlappingReservations(ReservationRequest req) {
        List<Reservation> reservations = reservationRepository
                .findVehicleOverlappingReservations(
                        req.getVehicleId(),
                        req.getStartTime(),
                        req.getEndTime().plusMinutes(GRACE_MINUTES)
                );

        if (!reservations.isEmpty()) {
            throw new AppException.BadRequestException(
                    "This vehicle already has a reservation in the selected time range"
            );
        }
    }

    @Transactional
    @Scheduled(fixedRate = 60000)
    public void autoUpdateConnectorStatus() {
        LocalDateTime now = LocalDateTime.now();

        // PENDING > 5 phút -> EXPIRED
        reservationRepository.findByStatus("PENDING").stream()
                .filter(r -> r.getCreatedAt().isBefore(now.minusMinutes(5)))
                .forEach(r -> {
                    r.setStatus("EXPIRED");
                    reservationRepository.save(r);
                    if (r.getConnector() != null) {
                        r.getConnector().setStatus("AVAILABLE");
                        connectorRepository.save(r.getConnector());
                    }
                });

        // SCHEDULED tới giờ -> VERIFYING + OCCUPIED
        reservationRepository.findByStatus("SCHEDULED").stream()
                .filter(r -> r.getStartTime().isBefore(now))
                .forEach(r -> {
                    r.setStatus("VERIFYING");
                    reservationRepository.save(r);
                    if (r.getConnector() != null) {
                        r.getConnector().setStatus("OCCUPIED");
                        connectorRepository.save(r.getConnector());
                    }
                });
        //Trễ > GRACE_MINUTES phút sau start cho VERIFYING / VERIFIED / PLUGGED → EXPIRED
        List<String> middleStates = List.of("VERIFYING", "VERIFIED", "PLUGGED");
        LocalDateTime expireBefore = now.minusMinutes(GRACE_MINUTES);
        List<Reservation> toExpire = reservationRepository.findByStatusInAndStartTimeBefore(middleStates, expireBefore);
        toExpire.forEach(r -> {
            r.setStatus("EXPIRED");
            r.setExpiredAt(now); // hoặc canceledAt nếu bạn thêm trường riêng
            reservationRepository.save(r);

            if (r.getConnector() != null) {
                r.getConnector().setStatus("AVAILABLE");
                connectorRepository.save(r.getConnector());
            }
            String msg = String.format("Your reservation at %s has been canceled because you did not start charging within %d minutes after the scheduled start.",
                    r.getStation().getName(), GRACE_MINUTES);
            notificationService.createNotification(r.getUser().getId(), "RESERVATION_EXPIRED", msg);
        });

        reservationRepository.findByStatusIn(
                        List.of("VERIFYING", "VERIFIED", "PLUGGED", "CHARGING", "SCHEDULED"))
                .stream()
                .filter(r -> r.getEndTime() != null && r.getEndTime().isBefore(now))
                .forEach(r -> {
                    r.setStatus("EXPIRED");
                    r.setExpiredAt(now);
                    reservationRepository.save(r);
                    if (r.getConnector() != null) {
                        r.getConnector().setStatus("AVAILABLE");
                        connectorRepository.save(r.getConnector());
                    }
                    String msg = String.format(
                            "Your reservation at %s has expired because the end time has passed.",
                            r.getStation().getName()
                    );
                    notificationService.createNotification(
                            r.getUser().getId(),
                            "RESERVATION_EXPIRED",
                            msg
                    );
                });
        //Gửi 1 notification trước start 5 phút
        reservationRepository.findByStatus("SCHEDULED").stream()
                .filter(r -> !Boolean.TRUE.equals(r.getNotifiedBeforeStart()))
                .filter(r -> r.getStartTime().isAfter(now) && r.getStartTime().isBefore(now.plusMinutes(5)))
                .forEach(r -> {
                    notificationService.createNotification(
                            r.getUser().getId(),
                            "Reservation Reminder",
                            "Your charging reservation will start in less than 5 minutes. If you are more than 15 minutes late after the start time, the system will automatically cancel your reservation."
                    );
                    r.setNotifiedBeforeStart(true);
                    reservationRepository.save(r);
                });
    }



}
