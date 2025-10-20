package com.pham.basis.evcharging.repository;

import com.pham.basis.evcharging.model.OneTimeToken;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OneTimeTokenRepository extends JpaRepository<OneTimeToken, String> {

    Optional<OneTimeToken> findByToken(String token);

    List<OneTimeToken> findByReservationIdAndUsedFalseAndExpiryDateAfter(Long reservationId, LocalDateTime now);

    void deleteByReservationId(Long reservationId);
    void deleteByToken(String token);
}
