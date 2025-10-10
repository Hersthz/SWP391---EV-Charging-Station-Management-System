package com.pham.basis.evcharging.repository;

import com.pham.basis.evcharging.model.StationReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StationReviewRepository extends JpaRepository<StationReview, Integer> {
    public List<StationReview>  findByChargingStationIdOrderByCreatedAtDesc(Long id);
}
