package com.pham.basis.evcharging.repository;

import com.pham.basis.evcharging.model.ChargingStation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChargingStationRepository extends JpaRepository<ChargingStation, Long> {

    Optional<ChargingStation> findChargingStationById(Long id);
    Optional<ChargingStation> findChargingStationByName(String name);
}