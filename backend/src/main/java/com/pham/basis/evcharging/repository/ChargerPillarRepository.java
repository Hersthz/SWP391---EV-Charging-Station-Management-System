package com.pham.basis.evcharging.repository;

import com.pham.basis.evcharging.model.ChargerPillar;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChargerPillarRepository extends JpaRepository<ChargerPillar, Long> {
    Optional<ChargerPillar> findChargerPillarById(Long id);
}
