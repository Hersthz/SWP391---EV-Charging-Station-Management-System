package com.pham.basis.evcharging.controller;


import com.pham.basis.evcharging.dto.response.ApiResponse;
import com.pham.basis.evcharging.dto.response.UserAnalyticsResponse;
import com.pham.basis.evcharging.service.UserAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/analytics")
public class UserAnalyticsController {
    private final UserAnalyticsService userAnalyticsService;

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserAnalyticsResponse>> getUserAnalytics(@PathVariable Long userId){
        UserAnalyticsResponse data = userAnalyticsService.getUserAnalytics(userId);
        return ResponseEntity.ok(new ApiResponse<>(
                "200",
                "Analytics successfully",
                data
        ));
    }
}
