package com.pham.basis.evcharging.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "connectors")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Connector {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String status; //AVAILABLE, OCCUPIED, MAINTENANCE

    @Column(nullable = false, length = 20)
    private String type; // CCS, CHAdeMO, Type2, AC

    //FK
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pillar_id", nullable = false)
    private ChargerPillar pillar;
}
