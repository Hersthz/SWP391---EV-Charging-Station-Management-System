package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.response.StaffAnalyticsResponse;

public interface StaffAnalyticsService {
    StaffAnalyticsResponse getStaffAnalytics(Long userId);
}
