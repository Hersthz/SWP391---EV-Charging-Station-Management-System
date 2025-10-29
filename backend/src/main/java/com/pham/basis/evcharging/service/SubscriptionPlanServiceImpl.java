package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.request.SubscriptionPlanRequest;
import com.pham.basis.evcharging.dto.response.SubscriptionPlanResponse;
import com.pham.basis.evcharging.mapper.SubscriptionPlanMapper;
import com.pham.basis.evcharging.model.SubscriptionPlan;
import com.pham.basis.evcharging.repository.SubscriptionPlanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SubscriptionPlanServiceImpl implements SubscriptionPlanService {
    @Autowired
    private SubscriptionPlanRepository planRepository;
    @Autowired
    private SubscriptionPlanMapper mapper;

    public List<SubscriptionPlanResponse> getAllPlans() {
        return planRepository.findAll().stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    public SubscriptionPlanResponse createPlan(SubscriptionPlanRequest request) {
        SubscriptionPlan plan = mapper.toEntity(request);
        return mapper.toResponse(planRepository.save(plan));
    }

    public SubscriptionPlanResponse getPlanById(Long id) {
        return planRepository.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new RuntimeException("Plan not found"));
    }

    public void deletePlan(Long id) {
        planRepository.deleteById(id);
    }
}
