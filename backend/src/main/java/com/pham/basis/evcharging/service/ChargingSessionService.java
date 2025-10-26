package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.request.StartChargingSessionRequest;
import com.pham.basis.evcharging.dto.response.AdjustTargetSocResponse;
import com.pham.basis.evcharging.dto.response.ChargingSessionResponse;
import com.pham.basis.evcharging.dto.response.ChargingStopResponse;
import com.pham.basis.evcharging.dto.response.PaymentResponse;
import com.pham.basis.evcharging.model.ChargingSession;
import org.springframework.data.domain.Page;

import java.math.BigDecimal;

public interface ChargingSessionService {
    ChargingSession startChargingSession(StartChargingSessionRequest request);

    ChargingSession updateChargingSession(Long sessionId, BigDecimal newEnergyCount);

    ChargingStopResponse stopChargingSession(Long sessionId);

    PaymentResponse createPaymentForSession(Long sessionId, String clientIp);

    AdjustTargetSocResponse adjustTargetSocForSession(Long sessionId, Double targetSoc);
    Page<ChargingSession> getAllU(Long userId, Integer size, Integer page);
    Page<ChargingSession> getAll(Integer size, Integer page);
}
