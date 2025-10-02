package com.pham.basis.evcharging.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Entity
@Table(name = "charger_pillars")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChargerPillar {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String code;    // Mã trụ
    private String status;  // Available, Occupied, Maintenance
    private Double power;   // kW
    private Double pricePerKwh; // Giá theo kWh

    @ManyToOne
    @JoinColumn(name = "station_id")
    private ChargingStation station;

    @OneToMany(mappedBy = "pillar", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Connector> connectors;
}