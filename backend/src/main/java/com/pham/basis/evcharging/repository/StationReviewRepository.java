package com.pham.basis.evcharging.repository;

import com.pham.basis.evcharging.model.StationReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StationReviewRepository extends JpaRepository<StationReview, Long> {
    List<StationReview>  findByChargingStationIdOrderByCreatedAtDesc(Long id);
    boolean existsByChargingStation_IdAndUser_Id(Long stationId, Long userId);
}
