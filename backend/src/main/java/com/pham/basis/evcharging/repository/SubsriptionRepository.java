package com.pham.basis.evcharging.repository;

import com.pham.basis.evcharging.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubsriptionRepository extends JpaRepository<Subscription, Long> {
}
