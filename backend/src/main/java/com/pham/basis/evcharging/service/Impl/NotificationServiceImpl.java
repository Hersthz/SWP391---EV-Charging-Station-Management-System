package com.pham.basis.evcharging.service.Impl;

import com.pham.basis.evcharging.dto.response.NotificationResponse;
import com.pham.basis.evcharging.exception.AppException;
import com.pham.basis.evcharging.model.Notification;
import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.repository.NotificationRepository;
import com.pham.basis.evcharging.repository.UserRepository;
import com.pham.basis.evcharging.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;


    @Override
    public Notification createNotification(Long userId, String type, String message) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException.NotFoundException("User not found"));
        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .message(message)
                .createdAt(LocalDateTime.now())
                .isRead(false)
                .build();
        notificationRepository.save(notification);

        return notification;
    }

    @Override
    public List<NotificationResponse> getNotification(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException.NotFoundException("User not found"));
        List<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(user);

        return notifications.stream()
                .sorted(Comparator.comparing(Notification::getCreatedAt).reversed())
                .map(n-> NotificationResponse
                .builder()
                .notificationId(n.getNotificationId())
                .type(n.getType())
                .message(n.getMessage())
                .createdAt(n.getCreatedAt())
                .isRead(n.getIsRead())
                .build()
        ).toList();
    }

    @Override
    public void updateNotification(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new AppException.NotFoundException("Notification not found"));
        notification.setIsRead(!notification.getIsRead());
        notificationRepository.save(notification);
    }


}
