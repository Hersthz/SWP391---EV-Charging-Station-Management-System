package com.pham.basis.evcharging.repository;

import com.pham.basis.evcharging.model.ChargingStation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChargingStationRepository extends JpaRepository<ChargingStation, Long> {
    Optional<ChargingStation> findByManagerId(Long managerId);
}
