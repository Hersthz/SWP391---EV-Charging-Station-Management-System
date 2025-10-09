package com.pham.basis.evcharging.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
    @Column(name = "price_per_kwh")
    private Double pricePerKwh; // Giá theo kWh

    @ManyToOne
    @JoinColumn(name = "station_id")
    @JsonIgnore
    private ChargingStation station;

    @OneToMany(mappedBy = "pillar", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Connector> connectors;

    // Helper: Thêm connector và set cả 2 phía relationship
    public void addConnector(Connector connector) {
        connectors.add(connector);
        connector.setPillar(this);
    }
}