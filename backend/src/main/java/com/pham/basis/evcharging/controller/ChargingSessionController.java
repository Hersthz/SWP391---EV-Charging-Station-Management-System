package com.pham.basis.evcharging.controller;

import com.pham.basis.evcharging.config.VNPayConfig;
import com.pham.basis.evcharging.dto.request.AdjustTargetSocRequest;
import com.pham.basis.evcharging.dto.request.StartChargingSessionRequest;
import com.pham.basis.evcharging.dto.response.*;
import com.pham.basis.evcharging.model.ChargingSession;
import com.pham.basis.evcharging.service.ChargingSessionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/session")
@RequiredArgsConstructor
public class ChargingSessionController {

    private final ChargingSessionService chargingSessionService;

    @PostMapping("/create")
    public ApiResponse<ChargingSessionResponse> startChargingSession(
            @RequestBody @Valid StartChargingSessionRequest request) {

        ChargingSession session = chargingSessionService.startChargingSession(request);

        return ApiResponse.<ChargingSessionResponse>builder()
                .code("200")
                .message("Charging session created successfully")
                .data(buildResponse(session))
                .build();
    }

    @PatchMapping("/{id}/update")
    public ApiResponse<ChargingSessionResponse> updateChargingSession(
            @PathVariable Long id,
            @RequestParam BigDecimal energyCount) {

        ChargingSession session = chargingSessionService.updateChargingSession(id, energyCount);

        return ApiResponse.<ChargingSessionResponse>builder()
                .code("200")
                .message("Charging session updated successfully")
                .data(buildResponse(session))
                .build();
    }

    @PostMapping("/{id}/stop")
    public ChargingStopResponse stopChargingSession(@PathVariable Long id) {
        return chargingSessionService.stopChargingSession(id);
    }

    @PostMapping("/{id}/pay")
    public PaymentResponse createPaymentForSession(
            @PathVariable Long id,
            HttpServletRequest request
    ) {
        String clientIp = VNPayConfig.getClientIp(request);
        return chargingSessionService.createPaymentForSession(id, clientIp);
    }

    @PostMapping("/{id}/adjust-soc-target")
    public AdjustTargetSocResponse adjustTargetSoc(
            @PathVariable Long id,
            @RequestBody @Valid AdjustTargetSocRequest request
    ) {
        return chargingSessionService.adjustTargetSocForSession(id, request.getTargetSoc());
    }

    private ChargingSessionResponse buildResponse(ChargingSession s) {
        return ChargingSessionResponse.builder()
                .id(s.getId())
                .stationId(s.getStation() != null ? s.getStation().getId() : null)
                .pillarId(s.getPillar() != null ? s.getPillar().getId() : null)
                .driverUserId(s.getDriver() != null ? s.getDriver().getId() : null)
                .vehicleId(s.getVehicle() != null ? s.getVehicle().getId() : null)
                .status(s.getStatus())
                .energyCount(s.getEnergyCount())
                .chargedAmount(s.getChargedAmount())
                .ratePerKwh(s.getRatePerKwh())
                .targetSoc(s.getTargetSoc())
                .socNow(s.getVehicle().getSocNow())
                .startTime(s.getStartTime())
                .endTime(s.getEndTime())
                .build();
    }
}
