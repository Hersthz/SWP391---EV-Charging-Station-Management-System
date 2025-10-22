package com.pham.basis.evcharging.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "charging_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChargingSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "session_id")
    private Long id;

    // --- FK ---
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id")
    private Reservation reservation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "station_id", nullable = false)
    private ChargingStation station;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pillar_id", nullable = false)
    private ChargerPillar pillar;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_user_id", nullable = false)
    private User driver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    // --- Thời gian ---
    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime; //null khi đang sạc

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // --- Thông tin sạc ---
    @Column(length = 20, nullable = false)
    private String status; // ACTIVE, COMPLETED, CANCELLED, FAILED...

    @Column(name = "energy_count", precision = 10, scale = 2, nullable = false)
    private BigDecimal energyCount; // kWh đã sạc

    @Column(name = "charged_amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal chargedAmount; // tổng tiền

    @Column(name = "rate_per_kwh", precision = 10, scale = 2)
    private BigDecimal ratePerKwh; // đơn giá tại thời điểm sạc

    @Column(name = "payment_method", nullable = false, length = 20)
    private String paymentMethod;

    @Column(name = "target_soc")
    private Double targetSoc;

    // ------
    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
