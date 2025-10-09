package com.pham.basis.evcharging.repository;

import com.pham.basis.evcharging.model.StationManager;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StationManagerRepository extends CrudRepository<StationManager, Long> {
    // Tìm tất cả trạm mà user quản lý
    List<StationManager> findByManagerId(Long managerId);

    // Tìm tất cả manager của một trạm
    List<StationManager> findByStationId(Long stationId);

    // Kiểm tra user có quản lý trạm không
    boolean existsByManagerIdAndStationId(Long managerId, Long stationId);
}
