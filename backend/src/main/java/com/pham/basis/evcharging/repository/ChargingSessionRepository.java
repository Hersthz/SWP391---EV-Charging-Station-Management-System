package com.pham.basis.evcharging.repository;

import com.pham.basis.evcharging.model.ChargingSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChargingSessionRepository extends JpaRepository<ChargingSession, Long> {
    Page<ChargingSession> findByDriver_Id(Long driverId, Pageable pageable);
    List<ChargingSession> findByDriver_Id(Long driverId);
    Long countByDriver_Id(Long driverId);
}
