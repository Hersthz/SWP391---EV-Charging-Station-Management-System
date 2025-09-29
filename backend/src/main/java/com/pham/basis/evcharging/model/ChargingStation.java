package com.pham.basis.evcharging.model;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "charging_stations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChargingStation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long stationId;
    private String name;
    private String address;
    private Double latitude;
    private Double longitude;

    @Transient
    private Double distance; // Tính khoảng cách runtime
}
