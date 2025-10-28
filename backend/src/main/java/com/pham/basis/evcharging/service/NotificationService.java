package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.response.NotificationResponse;
import com.pham.basis.evcharging.model.Notification;

import java.util.List;

public interface NotificationService {
    Notification createNotification(Long userId, String type, String message);
    List<NotificationResponse> getNotification(Long userId);
    void updateNotification(Long notificationId);
}
