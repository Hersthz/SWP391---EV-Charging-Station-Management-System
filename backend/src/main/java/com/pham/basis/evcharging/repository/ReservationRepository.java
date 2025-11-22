package com.pham.basis.evcharging.repository;

import com.pham.basis.evcharging.model.Reservation;
import com.pham.basis.evcharging.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.NativeQuery;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT r FROM Reservation r WHERE " +
            "r.connector.id = :connectorId AND " +
            "r.status IN ('PENDING', 'SCHEDULED', 'VERIFYING', 'VERIFIED', 'PLUGGED', 'CHARGING') AND " +
            "(:startTime < r.endTime AND :endTime > r.startTime)")
    List<Reservation> findOverlappingReservations(
            @Param("connectorId") Long connectorId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    @Modifying
    @Transactional
    @Query("UPDATE Reservation r SET r.status = :status WHERE r.id = :id")
    int updateStatusById(@Param("id") Long id, @Param("status") String status);

    List<Reservation> findByStatus(String status);

    Optional<Reservation> findByIdAndUser(Long id, User user);
    List<Reservation> findByStatusInAndStartTimeBefore(List<String> statuses, LocalDateTime
            time);
    List<Reservation> findByStationIdOrderByCreatedAtDesc(Long stationId);

    List<Reservation> findByStatusIn(List<String> statuses);

    @Query("""
    SELECT r FROM Reservation r
    WHERE r.vehicle.id = :vehicleId
      AND r.status IN ('PENDING', 'SCHEDULED', 'VERIFYING', 'VERIFIED', 'PLUGGED', 'CHARGING')
      AND (
            (r.startTime <= :endTime AND r.endTime >= :startTime)
          )
""")
    List<Reservation> findVehicleOverlappingReservations(
            Long vehicleId,
            LocalDateTime startTime,
            LocalDateTime endTime
    );

    long countByUserIdAndStatusAndExpiredAtBetween(Long userId, String status, LocalDateTime start, LocalDateTime end);
}

