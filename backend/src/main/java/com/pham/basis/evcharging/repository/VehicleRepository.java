package com.pham.basis.evcharging.repository;

import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle,Long> {
    List<Vehicle> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    void deleteByIdAndUser(Long id, User user);

    Optional<Vehicle> findByIdAndUserUsername(Long id, String username);
}
