package com.pham.basis.evcharging.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private Long notificationId;
    private String type;
    private String message;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
