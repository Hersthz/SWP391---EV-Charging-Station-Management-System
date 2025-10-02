package com.pham.basis.evcharging.repository;

import com.pham.basis.evcharging.model.ChargingStation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChargingStationRepository extends JpaRepository<ChargingStation, Long> {

    // Tìm trạm sạc trong bán kính (sử dụng Haversine formula)
    @Query(value = "SELECT *, " +
            "(6371 * acos(cos(radians(:latitude)) * cos(radians(latitude)) * " +
            "cos(radians(longitude) - radians(:longitude)) + " +
            "sin(radians(:latitude)) * sin(radians(latitude)))) AS distance " +
            "FROM charging_stations " +
            "HAVING distance < :radius " +
            "ORDER BY distance",
            nativeQuery = true)

    List<ChargingStation> findNearbyStations(
            @Param("latitude") Double latitude,
            @Param("longitude") Double longitude,
            @Param("radius") Double radius
    );
}