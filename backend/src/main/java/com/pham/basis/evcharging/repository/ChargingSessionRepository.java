package com.pham.basis.evcharging.repository;

import com.pham.basis.evcharging.model.ChargingSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ChargingSessionRepository extends JpaRepository<ChargingSession, Long> {
    Page<ChargingSession> findByDriver_Id(Long driverId, Pageable pageable);
    List<ChargingSession> findByDriver_Id(Long driverId);
    Long countByDriver_Id(Long driverId);

    @Query("SELECT COALESCE(SUM(s.energyCount), 0) FROM ChargingSession s")
    Double sumTotalEnergy();

    @Query("SELECT COALESCE(SUM(cs.energyCount),0) FROM ChargingSession cs " +
            "WHERE cs.station.id = :stationId AND cs.status='COMPLETED'")
    BigDecimal sumEnergyByStation(Long stationId);
}
