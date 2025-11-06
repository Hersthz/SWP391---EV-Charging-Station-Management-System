package com.pham.basis.evcharging.service.Impl;

import com.pham.basis.evcharging.dto.request.SubscriptionRequest;
import com.pham.basis.evcharging.dto.response.SubscriptionResponse;
import com.pham.basis.evcharging.exception.AppException;
import com.pham.basis.evcharging.mapper.SubscriptionMapper;
import com.pham.basis.evcharging.model.Subscription;
import com.pham.basis.evcharging.model.SubscriptionPlan;
import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.repository.SubscriptionPlanRepository;
import com.pham.basis.evcharging.repository.SubscriptionRepository;
import com.pham.basis.evcharging.repository.UserRepository;
import com.pham.basis.evcharging.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubscriptionServiceImpl implements SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository planRepository;
    private final SubscriptionMapper mapper;
    private final UserRepository userRepository;


    @Override
    public SubscriptionResponse createSubscription(SubscriptionRequest request) {
        SubscriptionPlan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> new AppException.NotFoundException("Plan not found"));
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new AppException.NotFoundException("User not found"));
        Subscription subscription = new Subscription();
        subscription.setUser(user);
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
    @Override
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
