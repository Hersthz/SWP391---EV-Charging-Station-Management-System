package com.pham.basis.evcharging.controller;

import com.pham.basis.evcharging.dto.response.NotificationResponse;
import com.pham.basis.evcharging.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping("/{userId}")
    public List<NotificationResponse> getNotifications(@PathVariable Long userId) {
        return notificationService.getNotification(userId);
    }

    @PutMapping("/read/{notificationId}")
    public void markAtRead(@PathVariable Long notificationId) {
        notificationService.updateNotification(notificationId);
    }
}
