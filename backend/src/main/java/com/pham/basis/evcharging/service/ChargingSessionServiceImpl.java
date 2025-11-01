package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.request.PaymentCreateRequest;
import com.pham.basis.evcharging.dto.request.StartChargingSessionRequest;
import com.pham.basis.evcharging.dto.response.AdjustTargetSocResponse;
import com.pham.basis.evcharging.dto.response.ChargingStopResponse;
import com.pham.basis.evcharging.dto.response.PaymentResponse;
import com.pham.basis.evcharging.exception.AppException;
import com.pham.basis.evcharging.model.*;
import com.pham.basis.evcharging.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChargingSessionServiceImpl implements ChargingSessionService {

    private final ChargingSessionRepository sessionRepo;
    private final ChargerPillarRepository pillarRepo;
    private final UserRepository userRepo;
    private final ReservationRepository reservationRepo;
    private final VehicleRepository vehicleRepo;
    private final WalletService walletService;
    private final PaymentService paymentService;
    private final SubscriptionService subscriptionService;
    private final SubscriptionRepository subscriptionRepo;

    private static final Logger log = LoggerFactory.getLogger(ChargingSessionServiceImpl.class);

    @Transactional
    public ChargingSession startChargingSession(StartChargingSessionRequest request) {
        ChargerPillar pillar = pillarRepo.findById(request.getPillarId())
                .orElseThrow(() -> new IllegalArgumentException("Pillar not found"));
        User driver = userRepo.findById(request.getDriverId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Vehicle vehicle = vehicleRepo.findById(request.getVehicleId())
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found"));
        Reservation reservation = reservationRepo.findById(request.getReservationId())
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found"));

        validatePaymentMethod(request.getPaymentMethod(), driver, request.getTargetSoc(), vehicle, pillar);
        reservationRepo.updateStatusById(request.getReservationId(),"CHARGING");
        ChargingSession session = ChargingSession.builder()
                .reservation(reservation)
                .pillar(pillar)
                .station(pillar.getStation())
                .driver(driver)
                .vehicle(vehicle)
                .startTime(LocalDateTime.now())
                .status("ACTIVE")
                .energyCount(BigDecimal.ZERO)
                .chargedAmount(BigDecimal.ZERO)
                .ratePerKwh(BigDecimal.valueOf(pillar.getPricePerKwh()))
                .paymentMethod(request.getPaymentMethod())
                .targetSoc(request.getTargetSoc())
                .initialSoc(vehicle.getSocNow() != null ? vehicle.getSocNow() : 0.0)
                .build();

        return sessionRepo.save(session);
    }

    @Transactional
    public ChargingSession updateChargingSession(Long sessionId, BigDecimal newEnergyCount) {
        ChargingSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        if (!"ACTIVE".equals(session.getStatus()))
            throw new IllegalArgumentException("Session is not active");

        BigDecimal energyDelta = newEnergyCount.subtract(session.getEnergyCount());
        if (energyDelta.compareTo(BigDecimal.ZERO) > 0) {
            // Update enegy
            session.setEnergyCount(newEnergyCount);
            session.setChargedAmount(session.getChargedAmount().add(energyDelta.multiply(session.getRatePerKwh())));
            session.setUpdatedAt(LocalDateTime.now());

            // Update SOC của vehicle
            Vehicle vehicle = session.getVehicle();
            Double batteryCapacity = vehicle.getBatteryCapacityKwh();
            Double initialSoc = session.getInitialSoc() != null ? session.getInitialSoc()
                    : (vehicle.getSocNow() != null ? vehicle.getSocNow() : 0.0);

            if (batteryCapacity != null && batteryCapacity > 0) {
                double newSoc = Math.min(1.0, initialSoc + (session.getEnergyCount().doubleValue() / batteryCapacity));
                vehicle.setSocNow(newSoc);
                vehicleRepo.save(vehicle);
            }
        }
        return sessionRepo.save(session);
    }

    @Transactional
    public ChargingStopResponse stopChargingSession(Long sessionId) {
        ChargingSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        if (!"ACTIVE".equals(session.getStatus()))
            throw new IllegalArgumentException("Session is not active");

        session.setStatus("COMPLETED");
        session.setEndTime(LocalDateTime.now());
        session.setUpdatedAt(LocalDateTime.now());
        sessionRepo.save(session);

        Vehicle vehicle = session.getVehicle();
        Double batteryCapacity = vehicle.getBatteryCapacityKwh();
        Double initialSoc = session.getInitialSoc() != null ? session.getInitialSoc()
                : (vehicle.getSocNow() != null ? vehicle.getSocNow() : 0.0);

        if (batteryCapacity != null && batteryCapacity > 0) {
            double finalSoc = Math.min(1.0, initialSoc + session.getEnergyCount().doubleValue() / batteryCapacity);
            vehicle.setSocNow(finalSoc);
            vehicleRepo.save(vehicle);
        }

        return ChargingStopResponse.builder()
                .sessionId(session.getId())
                .totalAmount(session.getChargedAmount())
                .paymentMethod(session.getPaymentMethod())
                .requiresPayment(!"WALLET".equals(session.getPaymentMethod()))
                .build();
    }

    @Transactional
    public PaymentResponse createPaymentForSession(Long sessionId, String clientIp) {
        ChargingSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        if (!"COMPLETED".equals(session.getStatus()))
            throw new IllegalArgumentException("Only completed sessions can be paid");
        if (session.getPayment() != null) {
            throw new IllegalArgumentException("Payment already exists for this session");
        }
        PaymentCreateRequest paymentRequest = PaymentCreateRequest.builder()
                .amount(session.getChargedAmount())
                .type("CHARGING-SESSION")
                .referenceId(session.getId())
                .description("Charging session: " + session.getId())
                .method(session.getPaymentMethod())
                .returnUrl(null)
                .build();

        PaymentResponse paymentResponse = paymentService.createPayment(
                paymentRequest, session.getDriver().getId(), clientIp
        );
        PaymentTransaction payment = paymentService.getPaymentEntity(paymentResponse.getPaymentId());
        session.setPayment(payment);
        sessionRepo.save(session);
        log.info("Payment created for session {}: {}", session.getId(), paymentResponse.getStatus());
        return paymentResponse;
    }


    @Transactional
    public AdjustTargetSocResponse adjustTargetSocForSession(Long sessionId, Double targetSoc) {
        ChargingSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));
        //validate
        if (targetSoc == null) throw new IllegalArgumentException("targetSoc required");
        if (!"ACTIVE".equals(session.getStatus())) {
            throw new IllegalArgumentException("Session is not active");
        }

        //load
        Vehicle vehicle = session.getVehicle();
        ChargerPillar pillar = session.getPillar();
        Reservation reservation = session.getReservation();
        User driver = session.getDriver();

        if (vehicle == null || pillar == null || reservation == null)
            throw new IllegalArgumentException("vehicle/pillar/reservation not found for session");
        // kiem tra vi
        validatePaymentMethod(session.getPaymentMethod(), driver, targetSoc, vehicle, pillar);
        // tinh enegy va time can thiet
        BigDecimal estimateAmount = calculateEstimateAmount(targetSoc, vehicle, pillar);
        //
        double powerKw = pillar.getPower() != null ? pillar.getPower() : 0.0;
        if (powerKw <= 0) throw new IllegalArgumentException("Invalid pillar power");
        double energyNeededKwh = (targetSoc - (vehicle.getSocNow() != null ? vehicle.getSocNow() : 0.0)) * vehicle.getBatteryCapacityKwh();
        long minutesNeeded = (long) Math.ceil((energyNeededKwh / powerKw) * 60.0);

        //
        LocalDateTime expectedEnd = LocalDateTime.now().plusMinutes(minutesNeeded);
        LocalDateTime desiredEndWithGrace = expectedEnd.plusMinutes(15);
        // update if not over reservation time
        if (!expectedEnd.isAfter(reservation.getEndTime())) {
            reservation.setEndTime(expectedEnd);
            reservation.setExpiredAt(desiredEndWithGrace);
            Reservation saved = reservationRepo.save(reservation);
            return AdjustTargetSocResponse.builder()
                    .updated(true)
                    .reservation(saved)
                    .estimatedAmount(estimateAmount)
                    .message("Updated within current reservation")
                    .build();
        }

        // check overlaps
        List<Reservation> overlaps = reservationRepo.findOverlappingReservations(
                reservation.getPillar().getId(), reservation.getStartTime(), desiredEndWithGrace);
        overlaps = overlaps.stream()
                .filter(r -> !r.getId().equals(reservation.getId()))
                .collect(Collectors.toList());

        if (overlaps.isEmpty()) {
            reservation.setEndTime(expectedEnd);
            reservation.setExpiredAt(desiredEndWithGrace);
            Reservation saved = reservationRepo.save(reservation);
            return AdjustTargetSocResponse.builder()
                    .updated(true)
                    .reservation(saved)
                    .estimatedAmount(estimateAmount)
                    .message("Extended reservation (no overlap)")
                    .build();
        }
        //
        String connectorType = reservation.getConnector() != null ? reservation.getConnector().getType() : null;
        List<ChargerPillar> suggestions = connectorType == null ? List.of()
                : pillarRepo.findAvailableByStationAndConnectorTypeBetween(reservation.getStation().getId(),connectorType, reservation.getStartTime(), desiredEndWithGrace);

        return AdjustTargetSocResponse.builder()
                .updated(false)
                .estimatedAmount(estimateAmount)
                .suggestedPillars(suggestions)
                .message("Overlap found, suggestions returned")
                .build();
    }

    @Override
    public Page<ChargingSession> getAllU(Long userId, Integer size, Integer page) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        Pageable pageable = PageRequest.of(page, size, Sort.by("startTime").descending());
        return sessionRepo.findByDriver_Id(userId, pageable);
    }

    @Override
    public Page<ChargingSession> getAll(Integer size, Integer page) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return sessionRepo.findAll(pageable);
    }

    // ---------- Helper ----------
    private void validatePaymentMethod(String method, User driver, Double targetSoc, Vehicle vehicle, ChargerPillar pillar) {
        if ("WALLET".equals(method)) {
            if (targetSoc == null)
                throw new IllegalArgumentException("Target SOC is required for wallet payment");

            BigDecimal estimateAmount = calculateEstimateAmount(targetSoc, vehicle, pillar);
            if (!walletService.hasSufficientBalance(driver.getId(), estimateAmount))
                throw new AppException.ConflictException("Insufficient wallet balance for estimated charging amount");
        }
    }

    private BigDecimal calculateEstimateAmount(Double targetSoc, Vehicle vehicle, ChargerPillar pillar) {
        Double currentSoc = vehicle.getSocNow() != null ? vehicle.getSocNow() : 0.0;
        if (targetSoc <= currentSoc)
            throw new IllegalArgumentException("Target SOC must be greater than current SOC");

        Double energyNeeded = (targetSoc - currentSoc) * vehicle.getBatteryCapacityKwh();
        BigDecimal baseAmount = BigDecimal.valueOf(energyNeeded * pillar.getPricePerKwh());
        return applySubscriptionDiscount(vehicle.getUser().getId(), baseAmount);
    }

    private BigDecimal applySubscriptionDiscount(Long userId, BigDecimal baseAmount) {
        Subscription subscription = subscriptionRepo.findByUserId(userId).orElse(null);
        if (subscription == null || subscription.getPlan() == null) {
            return baseAmount; // không có subscription => không giảm
        }

        String planName = subscription.getPlan().getName().toUpperCase();

        return switch (planName) {
            case "PRO" -> baseAmount.multiply(BigDecimal.valueOf(0.9));      // Giảm 10%
            case "PREMIUM" -> baseAmount.multiply(BigDecimal.valueOf(0.8));  // Giảm 20%
            default -> baseAmount; // FREE hoặc gói khác => không giảm
        };
    }
}
