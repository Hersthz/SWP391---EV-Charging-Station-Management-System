package com.pham.basis.evcharging.controller;

import com.pham.basis.evcharging.dto.request.SubscriptionPlanRequest;
import com.pham.basis.evcharging.dto.response.SubscriptionPlanResponse;
import com.pham.basis.evcharging.dto.response.ApiResponse;
import com.pham.basis.evcharging.service.SubscriptionPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/subs-plan")
@RequiredArgsConstructor
public class SubscriptionPlanController {

    private final SubscriptionPlanService planService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SubscriptionPlanResponse>>> getAllPlans() {
        List<SubscriptionPlanResponse> plans = planService.getAllPlans();
        return ResponseEntity.ok(
                ApiResponse.<List<SubscriptionPlanResponse>>builder()
                        .code("200")
                        .message("Fetched all subscription plans successfully")
                        .data(plans)
                        .build()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SubscriptionPlanResponse>> getPlanById(@PathVariable Long id) {
        SubscriptionPlanResponse plan = planService.getPlanById(id);
        return ResponseEntity.ok(
                ApiResponse.<SubscriptionPlanResponse>builder()
                        .code("200")
                        .message("Fetched subscription plan successfully")
                        .data(plan)
                        .build()
        );
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SubscriptionPlanResponse>> createPlan(@RequestBody SubscriptionPlanRequest request) {
        SubscriptionPlanResponse plan = planService.createPlan(request);
        return ResponseEntity.ok(
                ApiResponse.<SubscriptionPlanResponse>builder()
                        .code("201")
                        .message("Subscription plan created successfully")
                        .data(plan)
                        .build()
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePlan(@PathVariable Long id) {
        planService.deletePlan(id);
        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .code("200")
                        .message("Subscription plan deleted successfully")
                        .build()
        );
    }
}