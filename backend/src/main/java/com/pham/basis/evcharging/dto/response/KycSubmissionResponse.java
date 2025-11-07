package com.pham.basis.evcharging.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KycSubmissionResponse {

    private Long id;
    private Long userId;
    private String frontImageUrl;
    private String backImageUrl;
    private String status; // PENDING, APPROVED, REJECTED
    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
