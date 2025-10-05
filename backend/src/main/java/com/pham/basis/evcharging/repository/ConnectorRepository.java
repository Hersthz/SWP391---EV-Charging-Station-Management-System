package com.pham.basis.evcharging.repository;

import com.pham.basis.evcharging.model.Connector;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ConnectorRepository extends JpaRepository<Connector, Long> {
    Optional<Connector> findConnectorById(Long id);
}
