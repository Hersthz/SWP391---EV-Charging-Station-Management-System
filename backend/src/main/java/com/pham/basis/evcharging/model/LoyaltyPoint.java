package com.pham.basis.evcharging.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "loyalty_point")
@Data
public class LoyaltyPoint {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "session_id")
    private ChargingSession session;

    private int pointsEarned;
    private LocalDateTime createdAt = LocalDateTime.now();
}