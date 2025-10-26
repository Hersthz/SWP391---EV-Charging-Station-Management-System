package com.pham.basis.evcharging.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "station_review")
public class StationReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer rating;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "charging_station_id", nullable = false)
    private ChargingStation chargingStation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="user_id")
    private User user;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate()
    {
        createdAt = LocalDateTime.now();
    }
}