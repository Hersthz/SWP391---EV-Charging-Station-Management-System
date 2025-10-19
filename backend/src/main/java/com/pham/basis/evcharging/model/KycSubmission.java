package com.pham.basis.evcharging.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "kyc_submission")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KycSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "front_image_url", nullable = false, length = 255)
    private String frontImageUrl;

    @Column(name = "back_image_url", nullable = false, length = 255)
    private String backImageUrl;

    @Column(nullable = false, length = 50)
    private String status; //PENDING APPROVED, REJECTED

    @Column(name = "rejection_reason", length = 255)
    private String rejectionReason;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

