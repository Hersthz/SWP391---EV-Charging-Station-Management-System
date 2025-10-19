package com.pham.basis.evcharging.repository;

import com.pham.basis.evcharging.model.KycSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface KycRepository extends JpaRepository<KycSubmission, Long> {
}
