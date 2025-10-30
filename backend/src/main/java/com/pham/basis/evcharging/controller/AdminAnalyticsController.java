package com.pham.basis.evcharging.controller;

import com.pham.basis.evcharging.dto.response.AdminAnalyticsResponse;
import com.pham.basis.evcharging.service.AdminAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/analytics")
@RequiredArgsConstructor
public class AdminAnalyticsController {

    private final AdminAnalyticsService adminAnalyticsService;

    @GetMapping
    public AdminAnalyticsResponse getAdminAnalytics(@RequestParam Long adminId) {
        return adminAnalyticsService.getAdminAnalytics(adminId);
    }
}
