package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.request.SubscriptionRequest;
import com.pham.basis.evcharging.dto.response.SubscriptionResponse;
import com.pham.basis.evcharging.model.Subscription;

import java.util.List;
import java.util.Optional;

public interface SubscriptionService {
    SubscriptionResponse createSubscription(SubscriptionRequest request);
    List<SubscriptionResponse> getUserSubscriptions(Long userId);
    Optional<Subscription> getActiveSubscriptionByUserId(Long userId);
}
