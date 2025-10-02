package com.pham.basis.evcharging.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(name = "charging_stations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChargingStation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "station_id")
    private Long id;

    private String name;
    private String address;
    private Double latitude;
    private Double longitude;
    private String status; // Available, Occupied, Offline...

    @OneToMany(mappedBy = "station", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChargerPillar> pillars;

    @Transient
    private Double distance; // để tính toán khi query, không lưu DB
}