package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.request.PaymentCreateRequest;
import com.pham.basis.evcharging.dto.request.StartChargingSessionRequest;
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
        // 1. Validate và lấy thông tin
        ChargerPillar pillar = pillarRepo.findById(request.getPillarId())
                .orElseThrow(() -> new IllegalArgumentException("Pillar not found"));
        User driver = userRepo.findById(request.getDriverId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Vehicle vehicle = vehicleRepo.findById(request.getVehicleId())
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found"));

        // 2. Validate payment method
        validatePaymentMethod(request.getPaymentMethod(), driver, request.getTargetSoc(), vehicle, pillar);

        // 3. Tạo charging session
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
    public ChargingSession stopChargingSession(Long sessionId, String clientIp) {
        ChargingSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        if (!"ACTIVE".equals(session.getStatus())) {
            throw new IllegalArgumentException("Session is not active");
        }

        // 1. Finalize session (status + timestamps)
        session.setStatus("COMPLETED");
        session.setEndTime(LocalDateTime.now());
        session.setUpdatedAt(LocalDateTime.now());

        // 2. Build payment request from final charged amount
        PaymentCreateRequest paymentRequest = PaymentCreateRequest.builder()
                .amount(session.getChargedAmount())
                .type("CHARGING-SESSION")
                .referenceId(session.getId())
                .description("Charging session: " + session.getId())
                .method(session.getPaymentMethod())
                .returnUrl(null)
                .build();

        PaymentResponse paymentResponse = paymentService.createPayment(paymentRequest, session.getDriver().getId(), clientIp);


        if (paymentResponse != null) {
            log.info("Payment created for charging session {}: txnRef={}, status={}, url={}",
                    session.getId(), paymentResponse.getTxnRef(), paymentResponse.getStatus(), paymentResponse.getPaymentUrl());
        }

        // 5. Update vehicle SOC nếu có target (chọn cập nhật theo target hoặc tính theo năng lượng thực tế)
        Vehicle vehicle = session.getVehicle();
        if (vehicle != null && session.getTargetSoc() != null) {
            vehicle.setSocNow(session.getTargetSoc());
            vehicleRepo.save(vehicle);
        }

        // 6. Save session cuối cùng và trả về
        return sessionRepo.save(session);
    }

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
