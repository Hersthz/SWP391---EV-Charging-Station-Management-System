package com.pham.basis.evcharging.controller;

import com.pham.basis.evcharging.dto.request.SubscriptionRequest;
import com.pham.basis.evcharging.dto.response.SubscriptionResponse;
import com.pham.basis.evcharging.dto.response.ApiResponse;
import com.pham.basis.evcharging.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @PostMapping
    public ResponseEntity<ApiResponse<SubscriptionResponse>> createSubscription(@RequestBody SubscriptionRequest request) {
        SubscriptionResponse response = subscriptionService.createSubscription(request);
        return ResponseEntity.ok(
                ApiResponse.<SubscriptionResponse>builder()
                        .code("201")
                        .message("Subscription created successfully")
                        .data(response)
                        .build()
        );
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<SubscriptionResponse>>> getUserSubscriptions(@PathVariable Long userId) {
        List<SubscriptionResponse> subscriptions = subscriptionService.getUserSubscriptions(userId);
        return ResponseEntity.ok(
                ApiResponse.<List<SubscriptionResponse>>builder()
                        .code("200")
                        .message("Fetched user subscriptions successfully")
                        .data(subscriptions)
                        .build()
        );
    }
}
