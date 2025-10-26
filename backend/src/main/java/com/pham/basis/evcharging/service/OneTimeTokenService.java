package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.response.ApiResponse;
import com.pham.basis.evcharging.dto.response.OneTimeTokenResponse;
import com.pham.basis.evcharging.dto.response.ReservationResponse;
import com.pham.basis.evcharging.dto.response.VerifyTokenResponse;
import com.pham.basis.evcharging.model.OneTimeToken;

import java.util.Map;

public interface OneTimeTokenService {
    OneTimeTokenResponse createToken(Long userId, Long reservationId);
    VerifyTokenResponse verifyToken(String tokenStr, Long userId);
}
