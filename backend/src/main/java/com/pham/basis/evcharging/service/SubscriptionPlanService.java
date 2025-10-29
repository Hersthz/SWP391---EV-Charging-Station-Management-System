package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.request.SubscriptionPlanRequest;
import com.pham.basis.evcharging.dto.response.SubscriptionPlanResponse;

import java.util.List;

public interface SubscriptionPlanService {
    List<SubscriptionPlanResponse> getAllPlans();
    SubscriptionPlanResponse createPlan(SubscriptionPlanRequest request);
    SubscriptionPlanResponse getPlanById(Long id);
    void deletePlan(Long id);
}
