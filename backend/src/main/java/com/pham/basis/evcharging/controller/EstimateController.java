package com.pham.basis.evcharging.controller;

import com.pham.basis.evcharging.dto.request.EstimateRequest;
import com.pham.basis.evcharging.dto.response.EstimateResponse;
import com.pham.basis.evcharging.service.ChargingEstimatorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/estimate")
public class EstimateController {

    private final ChargingEstimatorService estimator;

    @Autowired
    public EstimateController(ChargingEstimatorService estimator) {
        this.estimator = estimator;
    }

    @PostMapping("/estimate-kw")
    public ResponseEntity<EstimateResponse> estimate(@RequestBody EstimateRequest request) {
        try {
            EstimateResponse resp = estimator.estimate(request);
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException ex) {
            EstimateResponse err = new EstimateResponse(0.0, 0, "Error: " + ex.getMessage());
            return ResponseEntity.badRequest().body(err);
        } catch (Exception ex) {
            EstimateResponse err = new EstimateResponse(0.0, 0, "Internal error");
            return ResponseEntity.status(500).body(err);
        }
    }
}
