package com.pham.basis.evcharging.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "connectors")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Connector {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String type; // CCS, CHAdeMO, AC

    @ManyToOne
    @JoinColumn(name = "pillar_id")
    private ChargerPillar pillar;
}