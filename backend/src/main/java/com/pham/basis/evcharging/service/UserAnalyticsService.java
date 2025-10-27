package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.response.UserAnalyticsResponse;

public interface UserAnalyticsService {
    UserAnalyticsResponse getUserAnalytics(Long userId);
}
