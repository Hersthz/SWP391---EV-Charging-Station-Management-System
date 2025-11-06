package com.pham.basis.evcharging.controller;

import com.pham.basis.evcharging.dto.response.StaffAnalyticsResponse;
import com.pham.basis.evcharging.service.StaffAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/staff/analytics")
@RequiredArgsConstructor
public class StaffAnalyticsController {
    private final StaffAnalyticsService staffAnalyticsService;

    @GetMapping
    public StaffAnalyticsResponse getAdminAnalytics(@RequestParam Long staffId) {
        return staffAnalyticsService.getStaffAnalytics(staffId);
    }
}
