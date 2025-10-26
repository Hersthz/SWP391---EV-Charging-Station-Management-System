package com.pham.basis.evcharging.controller;


import com.pham.basis.evcharging.dto.request.OneTimeTokenRequest;
import com.pham.basis.evcharging.dto.request.OneTimeTokenVerifyRequest;
import com.pham.basis.evcharging.dto.response.ApiResponse;
import com.pham.basis.evcharging.dto.response.OneTimeTokenResponse;
import com.pham.basis.evcharging.dto.response.VerifyTokenResponse;
import com.pham.basis.evcharging.service.OneTimeTokenService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/token")
@RequiredArgsConstructor
public class OneTimeTokenController {
    private final OneTimeTokenService tokenService;

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<OneTimeTokenResponse>> createToken(
            @Valid @RequestBody OneTimeTokenRequest req) {

        OneTimeTokenResponse dto = tokenService.createToken(req.getUserId(), req.getReservationId());
        ApiResponse<OneTimeTokenResponse> resp = new ApiResponse<>("200", "Token created", dto);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<VerifyTokenResponse>> verifyToken(
            @Valid @RequestBody OneTimeTokenVerifyRequest req) {

        VerifyTokenResponse dto = tokenService.verifyToken(req.getToken(), req.getUserId());
        ApiResponse<VerifyTokenResponse> resp = new ApiResponse<>("200", "Check-in successful", dto);
        return ResponseEntity.ok(resp);
    }
}
