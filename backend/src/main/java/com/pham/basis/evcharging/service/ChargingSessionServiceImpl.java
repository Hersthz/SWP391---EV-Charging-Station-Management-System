package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.request.PaymentCreateRequest;
import com.pham.basis.evcharging.dto.request.StartChargingSessionRequest;
import com.pham.basis.evcharging.dto.response.ChargingStopResponse;
import com.pham.basis.evcharging.dto.response.PaymentResponse;
import com.pham.basis.evcharging.model.*;
import com.pham.basis.evcharging.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.slf4j.LoggerFactory;


@Service
@RequiredArgsConstructor
public class ChargingSessionServiceImpl implements  ChargingSessionService {

    private final ChargingSessionRepository sessionRepo;
    private final ChargerPillarRepository pillarRepo;
    private final UserRepository userRepo;
    private final VehicleRepository vehicleRepo;
    private final WalletService walletService;
    private final PaymentService paymentService;

    private static final Logger log = LoggerFactory.getLogger(ChargingSessionService.class);

    @Transactional
    public ChargingSession startChargingSession(StartChargingSessionRequest request) {
        // Validate
        ChargerPillar pillar = pillarRepo.findById(request.getPillarId())
                .orElseThrow(() -> new IllegalArgumentException("Pillar not found"));
        User driver = userRepo.findById(request.getDriverId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Vehicle vehicle = vehicleRepo.findById(request.getVehicleId())
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found"));

        // Validate payment method
        validatePaymentMethod(request.getPaymentMethod(), driver, request.getTargetSoc(), vehicle, pillar);

        ChargingSession session = ChargingSession.builder()
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
                .build();

        return sessionRepo.save(session);
    }

    @Transactional
    public ChargingSession updateChargingSession(Long sessionId, BigDecimal newEnergyCount) {
        ChargingSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        if (!"ACTIVE".equals(session.getStatus())) {
            throw new IllegalArgumentException("Session is not active");
        }

        BigDecimal energyDelta = newEnergyCount.subtract(session.getEnergyCount());

        if (energyDelta.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal amountDelta = energyDelta.multiply(session.getRatePerKwh());

            session.setEnergyCount(newEnergyCount);
            session.setChargedAmount(session.getChargedAmount().add(amountDelta));
            session.setUpdatedAt(LocalDateTime.now());
        }

        return sessionRepo.save(session);
    }

    @Transactional
    public ChargingStopResponse stopChargingSession(Long sessionId) {
        ChargingSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        if (!"ACTIVE".equals(session.getStatus())) {
            throw new IllegalArgumentException("Session is not active");
        }

        session.setStatus("COMPLETED");
        session.setEndTime(LocalDateTime.now());
        session.setUpdatedAt(LocalDateTime.now());
        sessionRepo.save(session);

        // Update vehicle soc
        Vehicle vehicle = session.getVehicle();
        if (vehicle != null) {
            Double currentSoc = vehicle.getSocNow() != null ? vehicle.getSocNow() : 0.0;
            Double batteryCapacity = vehicle.getBatteryCapacityKwh();
            Double energyCharged = session.getEnergyCount().doubleValue();

            Double socIncrease = energyCharged / batteryCapacity;
            Double newSoc = Math.min(currentSoc + socIncrease, 1.0);
            vehicle.setSocNow(newSoc);
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

        if (!"COMPLETED".equals(session.getStatus())) {
            throw new IllegalArgumentException("Only completed sessions can be paid");
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
                paymentRequest,
                session.getDriver().getId(),
                clientIp
        );

        log.info("Payment created for session {}: {}", session.getId(), paymentResponse.getStatus());
        return paymentResponse;
    }



    //----------------Helper-------------
    private void validatePaymentMethod(String method, User driver, Double targetSoc, Vehicle vehicle, ChargerPillar pillar) {
        if ("WALLET".equals(method)) {
            if (targetSoc == null) {
                throw new IllegalArgumentException("Target SOC is required for wallet payment");
            }
            BigDecimal estimateAmount = calculateEstimateAmount(targetSoc, vehicle, pillar);

            if (!walletService.hasSufficientBalance(driver.getId(), estimateAmount)) {
                throw new IllegalArgumentException("Insufficient wallet balance for estimated charging amount");
            }
        }
    }

    private BigDecimal calculateEstimateAmount(Double targetSoc, Vehicle vehicle, ChargerPillar pillar) {
        Double currentSoc = vehicle.getSocNow() != null ? vehicle.getSocNow() : 0.0;
        if (targetSoc <= currentSoc) {
            throw new IllegalArgumentException("Target SOC must be greater than current SOC");
        }
        Double energyNeeded = (targetSoc - currentSoc) * vehicle.getBatteryCapacityKwh();
        return BigDecimal.valueOf(energyNeeded * pillar.getPricePerKwh());
    }

}
