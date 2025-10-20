package com.pham.basis.evcharging.controller;


import com.pham.basis.evcharging.dto.request.OneTimeTokenRequest;
import com.pham.basis.evcharging.dto.request.OneTimeTokenVerifyRequest;
import com.pham.basis.evcharging.dto.response.ApiResponse;
import com.pham.basis.evcharging.service.OneTimeTokenService;
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
    public ResponseEntity<ApiResponse<Map<String, Object>>> createToken(
            @RequestBody OneTimeTokenRequest req) {
        Long userId = req.getUserId();
        ApiResponse<Map<String, Object>> resp = tokenService.createToken(userId, req.getReservationId());
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyToken(
            @RequestBody OneTimeTokenVerifyRequest req) {
        Long userId = req.getUserId();
        ApiResponse<Map<String, Object>> resp = tokenService.verifyToken(req.getToken(), userId);
        return ResponseEntity.ok(resp);
    }
}
