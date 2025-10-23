package com.pham.basis.evcharging.model;

import jakarta.persistence.*;
import lombok.*;
import net.minidev.json.annotate.JsonIgnore;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "charger_pillars")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChargerPillar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String code; // AC- | DC-

    @Column(nullable = false, length = 20)
    private String status; // AVAILABLE | OCCUPIED | MAINTENANCE

    @Column(nullable = false)
    private Double power;

    @Column(name = "price_per_kwh", nullable = false)
    private Double pricePerKwh;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "station_id", nullable = false)
    @JsonIgnore
    private ChargingStation station;

    @OneToMany(mappedBy = "pillar", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Connector> connectors = new ArrayList<>();

    @OneToMany(mappedBy = "pillar", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChargingSession> sessions = new ArrayList<>();

    // Helper: gắn quan hệ 2 chiều
    public void addConnector(Connector connector) {
        connectors.add(connector);
        connector.setPillar(this);
    }
}
