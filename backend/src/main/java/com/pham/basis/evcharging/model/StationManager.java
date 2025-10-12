package com.pham.basis.evcharging.model;


import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "station_managers",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "station_id"})
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StationManager {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User manager;

    @ManyToOne
    @JoinColumn(name = "station_id", nullable = false)
    private ChargingStation station;
}
