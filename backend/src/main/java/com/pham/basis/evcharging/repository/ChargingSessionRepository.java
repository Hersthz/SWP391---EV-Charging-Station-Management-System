package com.pham.basis.evcharging.repository;

import com.pham.basis.evcharging.model.ChargerPillar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChargingSessionRepository extends JpaRepository<ChargerPillar, Long> {
}
