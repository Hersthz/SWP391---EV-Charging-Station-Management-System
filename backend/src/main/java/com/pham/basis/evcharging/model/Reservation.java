package com.pham.basis.evcharging.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "reservation")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reservation_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "station_id", nullable = false)
    private ChargingStation station;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pillar_id", nullable = false)
    private ChargerPillar pillar;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "connector_id", nullable = false)
    private Connector connector;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "hold_until")
    private LocalDateTime holdUntil;

    @Column(name = "hold_fee", precision = 10, scale = 2)
    private BigDecimal holdFee;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name="estimatedKwh")
    private Double estimatedKwh;


//    // --- Liên kết 1-1 với ChargingSession ---
//    @OneToOne(mappedBy = "reservation", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
//    private ChargingSession chargingSession;
}
