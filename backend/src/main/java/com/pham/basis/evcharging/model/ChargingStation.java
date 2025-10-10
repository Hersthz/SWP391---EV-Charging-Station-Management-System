package com.pham.basis.evcharging.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
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
    private String status;

    @OneToMany(mappedBy = "station", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChargerPillar> pillars =  new ArrayList<>();

    @Transient
    private Double distance; // để tính toán khi query, không lưu DB

    @OneToMany(mappedBy = "station", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<StationManager> managers;

    // Helper: Thêm pillar và set cả 2 phía relationship
    public void addPillar(ChargerPillar pillar) {
        pillars.add(pillar);
        pillar.setStation(this);
    }
}