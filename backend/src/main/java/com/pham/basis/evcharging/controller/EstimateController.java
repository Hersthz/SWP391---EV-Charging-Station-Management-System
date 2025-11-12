package com.pham.basis.evcharging.controller;

import com.pham.basis.evcharging.dto.request.EstimateRequest;
import com.pham.basis.evcharging.dto.request.EstimateTrueSpeedRequest;
import com.pham.basis.evcharging.dto.response.ApiResponse;
import com.pham.basis.evcharging.dto.response.EstimateResponse;
import com.pham.basis.evcharging.dto.response.EstimateTrueResponse;
import com.pham.basis.evcharging.service.ChargingEstimatorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/estimate")
@RequiredArgsConstructor
public class EstimateController {

    private final ChargingEstimatorService estimator;

    @PostMapping("/estimate-kw")
    public ResponseEntity<EstimateResponse> estimate(@Valid @RequestBody EstimateRequest request) {
        try {
            EstimateResponse resp = estimator.estimate(request);
            return ResponseEntity.ok(resp);
        } catch (Exception ex) {
            EstimateResponse err = EstimateResponse.builder()
                    .energyKwh(0.0)
                    .energyFromStationKwh(0.0)
                    .estimatedCost(0.0)
                    .estimatedMinutes(0)
                    .advice("Error: " + ex.getMessage())
                    .build();
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PostMapping("/estimateReal")
    public ResponseEntity<ApiResponse<EstimateTrueResponse>> estimateByTestSpeed(
            @Valid @RequestBody EstimateTrueSpeedRequest request) {

        try {
            EstimateTrueResponse resp = estimator.estimateSimpleUntilReservation(request);
            return ResponseEntity.ok(ApiResponse.<EstimateTrueResponse>builder()
                    .code("200")
                    .message("Estimate Success")
                    .data(resp)
                    .build());
        } catch (Exception ex) {
            EstimateTrueResponse err = EstimateTrueResponse.builder()
                    .energyKwh(0.0)
                    .estimatedCost(0.0)
                    .estimatedMinutes(0)
                    .socTarget(request.getSocNow())
                    .minuteUntilEnd(0.0)
                    .build();
            return ResponseEntity.badRequest().body(ApiResponse.<EstimateTrueResponse>builder()
                    .code("200")
                    .data(err)
                    .message(ex.getMessage())
                    .build());
        }
    }
}
