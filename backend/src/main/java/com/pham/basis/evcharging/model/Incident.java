package com.pham.basis.evcharging.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "incidents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Incident {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "station_id", nullable = false)
    private ChargingStation station;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pillar_id")
    private ChargerPillar pillar;

    @Column(nullable = false, length = 20)
    private String priority;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_by")
    private User reportedBy;

    @Column(name = "reported_time")
    private LocalDateTime reportedTime;
}
