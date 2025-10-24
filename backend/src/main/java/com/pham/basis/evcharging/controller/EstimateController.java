package com.pham.basis.evcharging.controller;

import com.pham.basis.evcharging.dto.request.EstimateRequest;
import com.pham.basis.evcharging.dto.response.EstimateResponse;
import com.pham.basis.evcharging.service.ChargingEstimatorService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/estimate")
@RequiredArgsConstructor
public class EstimateController {

    private final ChargingEstimatorService estimator;

    @PostMapping("/estimate-kw")
    public ResponseEntity<EstimateResponse> estimate(@RequestBody EstimateRequest request) {
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
}
