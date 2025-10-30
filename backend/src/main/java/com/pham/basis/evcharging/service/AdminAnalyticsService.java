package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.response.AdminAnalyticsResponse;

public interface AdminAnalyticsService {
    AdminAnalyticsResponse getAdminAnalytics(Long userId);
}
