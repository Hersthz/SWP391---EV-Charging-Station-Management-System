package com.pham.basis.evcharging.repository;

import com.pham.basis.evcharging.model.LoyaltyPoint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoyaltyPointRepository extends JpaRepository<LoyaltyPoint, Long> {
    List<LoyaltyPoint> findByUserId(Long userId);
}
