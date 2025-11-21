package com.pham.basis.evcharging.repository;

import com.pham.basis.evcharging.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role,Integer> {
    @Override
    Optional<Role> findById(Integer integer);

    Optional<Role> findByName(String name);
}
