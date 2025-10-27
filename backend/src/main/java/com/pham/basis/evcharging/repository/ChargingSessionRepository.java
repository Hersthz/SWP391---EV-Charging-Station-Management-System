package com.pham.basis.evcharging.repository;

import com.pham.basis.evcharging.model.ChargingSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChargingSessionRepository extends JpaRepository<ChargingSession, Long> {
    Page<ChargingSession> findByDriverId(Long driverId, Pageable pageable);
    List<ChargingSession> findByDriverId(Long driverId);
    Long countByDriverId(Long driverId);
}
