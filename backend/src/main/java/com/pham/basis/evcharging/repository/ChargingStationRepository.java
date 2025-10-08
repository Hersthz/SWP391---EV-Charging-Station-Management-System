package com.pham.basis.evcharging.repository;

import com.pham.basis.evcharging.model.ChargingStation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChargingStationRepository extends JpaRepository<ChargingStation, Long> {

    @Query(
            value = """
            SELECT s.*, 
                (6371 * acos(
                    cos(radians(:latitude)) * cos(radians(s.latitude)) *
                    cos(radians(s.longitude) - radians(:longitude)) +
                    sin(radians(:latitude)) * sin(radians(s.latitude))
                )) AS distance
            FROM charging_stations s
            WHERE 
                (:latitude IS NULL OR :longitude IS NULL OR 
                 (6371 * acos(
                    cos(radians(:latitude)) * cos(radians(s.latitude)) *
                    cos(radians(s.longitude) - radians(:longitude)) +
                    sin(radians(:latitude)) * sin(radians(s.latitude))
                 )) <= :radius)
              AND (
                  :search IS NULL 
                  OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%'))
                  OR LOWER(s.address) LIKE LOWER(CONCAT('%', :search, '%'))
              )
              AND EXISTS (
                  SELECT 1 FROM charger_pillars p 
                  LEFT JOIN connectors c ON p.id = c.pillar_id
                  WHERE p.station_id = s.station_id
                    AND (:minPower IS NULL OR p.power >= :minPower)
                    AND (:maxPower IS NULL OR p.power <= :maxPower)
                    AND (:minPrice IS NULL OR p.price_per_kwh >= :minPrice)
                    AND (:maxPrice IS NULL OR p.price_per_kwh <= :maxPrice)
                    AND (:availableOnly IS NULL OR :availableOnly = 0 OR p.status = 'Available')
                    AND (:connectors IS NULL OR c.type IN (:connectors))
              )
            ORDER BY distance ASC
            """,
            countQuery = """
            SELECT COUNT(*)
            FROM charging_stations s
            WHERE 
                (:latitude IS NULL OR :longitude IS NULL OR 
                 (6371 * acos(
                    cos(radians(:latitude)) * cos(radians(s.latitude)) *
                    cos(radians(s.longitude) - radians(:longitude)) +
                    sin(radians(:latitude)) * sin(radians(s.latitude))
                 )) <= :radius)
              AND (
                  :search IS NULL 
                  OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%'))
                  OR LOWER(s.address) LIKE LOWER(CONCAT('%', :search, '%'))
              )
              AND EXISTS (
                  SELECT 1 FROM charger_pillars p 
                  LEFT JOIN connectors c ON p.id = c.pillar_id
                  WHERE p.station_id = s.station_id
                    AND (:minPower IS NULL OR p.power >= :minPower)
                    AND (:maxPower IS NULL OR p.power <= :maxPower)
                    AND (:minPrice IS NULL OR p.price_per_kwh >= :minPrice)
                    AND (:maxPrice IS NULL OR p.price_per_kwh <= :maxPrice)
                    AND (:availableOnly IS NULL OR :availableOnly = 0 OR p.status = 'Available')
                    AND (:connectors IS NULL OR c.type IN (:connectors))
              )
            """,
            nativeQuery = true
    )
    Page<ChargingStation> findNearbyStations(
            @Param("latitude") Double latitude,
            @Param("longitude") Double longitude,
            @Param("radius") Double radius,
            @Param("connectors") List<String> connectors,
            @Param("minPower") Double minPower,
            @Param("maxPower") Double maxPower,
            @Param("minPrice") Double minPrice,
            @Param("maxPrice") Double maxPrice,
            @Param("availableOnly") Integer availableOnly,
            @Param("search") String search,
            Pageable pageable
    );

    Optional<ChargingStation> findChargingStationById(Long id);
}
