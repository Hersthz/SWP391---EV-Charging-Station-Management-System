package com.pham.basis.evcharging.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "vehicles")
public class Vehicle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String make;
    private String model;

    @Column(name = "battery_capacity_kwh", nullable = false)
    private Double batteryCapacityKwh;

    @Column(name = "ac_max_kw", nullable = false)
    private Double acMaxKw;

    @Column(name = "dc_max_kw", nullable = false)
    private Double dcMaxKw;

    private Double efficiency;
}
