package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.response.ApiResponse;
import com.pham.basis.evcharging.dto.response.ReservationResponse;
import com.pham.basis.evcharging.model.OneTimeToken;

import java.util.Map;

public interface OneTimeTokenService {
    public ApiResponse<Map<String, Object>> createToken(Long userId, Long reservationId);
    public ApiResponse<Map<String, Object>> verifyToken(String tokenStr, Long userId);
}
