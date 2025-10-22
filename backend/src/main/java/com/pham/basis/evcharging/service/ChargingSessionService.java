package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.request.StartChargingSessionRequest;
import com.pham.basis.evcharging.model.ChargingSession;

public interface ChargingSessionService {
    public ChargingSession startChargingSession(StartChargingSessionRequest request);
}
