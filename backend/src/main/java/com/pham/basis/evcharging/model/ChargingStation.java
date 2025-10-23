package com.pham.basis.evcharging.model;

import jakarta.persistence.*;
import lombok.*;
import net.minidev.json.annotate.JsonIgnore;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "charging_stations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChargingStation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "station_id")
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 255)
    private String address;

    private Double latitude;
    private Double longitude;

    @Column(length = 20)
    private String status; // Active, Inactive, Maintenance

    @OneToMany(mappedBy = "station", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChargerPillar> pillars = new ArrayList<>();

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private User manager;

    @OneToMany(mappedBy = "station", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChargingSession> sessions = new ArrayList<>();

    @Transient
    private Double distance; // không lưu DB, chỉ dùng để tính khoảng cách

    // Helper method: gắn quan hệ 2 chiều
    public void addPillar(ChargerPillar pillar) {
        pillars.add(pillar);
        pillar.setStation(this);
    }
}
