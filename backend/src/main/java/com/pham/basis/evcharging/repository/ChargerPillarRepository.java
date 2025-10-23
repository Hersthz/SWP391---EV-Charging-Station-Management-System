package com.pham.basis.evcharging.repository;

import com.pham.basis.evcharging.model.ChargerPillar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ChargerPillarRepository extends JpaRepository<ChargerPillar, Long> {
    Optional<ChargerPillar> findChargerPillarById(Long id);

    @Query("""
    select p from ChargerPillar p
    where p.station.id = :stationId
    and exists (
      select c from Connector c where c.pillar = p and c.type = :connectorType
    )
    and p.id not in (
      select r.pillar.id from Reservation r
      where r.startTime < :end and r.endTime > :start 
        and r.status in ('PENDING','SCHEDULED','VERIFYING','PLUGGED','CHARGING')
    )
    """)
    List<ChargerPillar> findAvailableByStationAndConnectorTypeBetween(
            @Param("stationId") Long stationId,
            @Param("connectorType") String connectorType,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);
}
