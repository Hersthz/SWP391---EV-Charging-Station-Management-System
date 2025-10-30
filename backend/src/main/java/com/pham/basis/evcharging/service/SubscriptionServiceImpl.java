package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.request.SubscriptionRequest;
import com.pham.basis.evcharging.dto.response.SubscriptionResponse;
import com.pham.basis.evcharging.mapper.SubscriptionMapper;
import com.pham.basis.evcharging.model.Subscription;
import com.pham.basis.evcharging.model.SubscriptionPlan;
import com.pham.basis.evcharging.repository.SubscriptionPlanRepository;
import com.pham.basis.evcharging.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubscriptionServiceImpl implements SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository planRepository;
    private final SubscriptionMapper mapper;

    public SubscriptionResponse createSubscription(SubscriptionRequest request) {
        SubscriptionPlan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> new RuntimeException("Plan not found"));

        Subscription subscription = new Subscription();
        subscription.setUserId(request.getUserId());
        subscription.setPlan(plan);
        subscription.setStartDate(request.getStartDate());
        subscription.setStatus("ACTIVE");
        subscription.setPriceAtPurchase(plan.getPrice());

        if ("monthly".equalsIgnoreCase(plan.getBillingCycle())) {
            subscription.setEndDate(request.getStartDate().plusMonths(1));
        } else {
            subscription.setEndDate(request.getStartDate().plusYears(1));
        }


        return mapper.toResponse(subscriptionRepository.save(subscription));
    }

    public List<SubscriptionResponse> getUserSubscriptions(Long userId) {
        return subscriptionRepository.findByUserId(userId)
                .stream().map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<Subscription> getActiveSubscriptionByUserId(Long userId) {
        return subscriptionRepository.findByUserId(userId)
                .stream()
                .filter(s -> "ACTIVE".equalsIgnoreCase(s.getStatus()))
                .findFirst();
    }
}
