package com.pham.basis.evcharging.controller;

import com.pham.basis.evcharging.config.VNPayConfig;
import com.pham.basis.evcharging.dto.request.AdjustTargetSocRequest;
import com.pham.basis.evcharging.dto.request.StartChargingSessionRequest;
import com.pham.basis.evcharging.dto.response.AdjustTargetSocResponse;
import com.pham.basis.evcharging.dto.response.ChargingStopResponse;
import com.pham.basis.evcharging.dto.response.PaymentResponse;
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
    public ChargingSession startChargingSession(@RequestBody @Valid StartChargingSessionRequest request) {
        return chargingSessionService.startChargingSession(request);
    }

    @PatchMapping("/{id}/update")
    public ChargingSession updateChargingSession(
            @PathVariable Long id,
            @RequestParam BigDecimal energyCount
    ) {
        return chargingSessionService.updateChargingSession(id, energyCount);
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

    @GetMapping("/{id}/max-soc")
    public ResponseEntity<Double> getMaxSoc(@PathVariable Long id) {
        Double maxSoc = chargingSessionService.getMaxSocTarget(id);
        return ResponseEntity.ok(maxSoc);
    }

    @PostMapping("/{id}/adjust-soc-target")
    public AdjustTargetSocResponse adjustTargetSoc(
            @PathVariable Long id,
            @RequestBody @Valid AdjustTargetSocRequest request
    ) {
        return chargingSessionService.adjustTargetSocForSession(id, request.getTargetSoc());
    }
}
