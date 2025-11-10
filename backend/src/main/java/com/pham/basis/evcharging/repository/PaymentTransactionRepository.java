package com.pham.basis.evcharging.repository;

import com.pham.basis.evcharging.model.PaymentTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction,Long> {

    boolean existsByTxnRef(String txnRef);

    Optional<PaymentTransaction> findByTxnRef(String txnRef);

    @Query("SELECT pt FROM PaymentTransaction pt " +
            "WHERE pt.type = :type AND pt.referenceId = :referenceId " +
            "AND pt.user.id = :userId AND pt.amount = :amount AND pt.status = 'PENDING'"
    )
    Optional<PaymentTransaction> findPendingByTypeAndReference(
            @Param("type") String type,
            @Param("referenceId") Long referenceId,
            @Param("userId") Long userId,
            @Param("amount") BigDecimal amount
    );

    Page<PaymentTransaction> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    // sum all
    @Query("""
    SELECT COALESCE(SUM(pt.amount), 0)
    FROM PaymentTransaction pt
    WHERE pt.user.id = :userId
      AND pt.status = 'SUCCESS'
      AND NOT (pt.method = 'VNPAY' AND pt.type = 'WALLET')
    """)
    BigDecimal sumSpendingExcludingVnpayWallet(@Param("userId") Long userId);
    // sum by month and year
    @Query(value = """
    SELECT COALESCE(SUM(pt.amount), 0)
    FROM PaymentTransaction pt
    WHERE pt.user.id = :userId
      AND pt.status = 'SUCCESS'
      AND NOT (pt.method = 'VNPAY' AND pt.type = 'WALLET')
      AND FUNCTION('YEAR', pt.createdAt) = :year
      AND FUNCTION('MONTH', pt.createdAt) = :month
    """)
    BigDecimal sumSpendingByUserAndMonth(@Param("userId") Long userId,
                                         @Param("year") int year,
                                         @Param("month") int month);

    @Query("""
SELECT COALESCE(SUM(pt.amount), 0)
FROM PaymentTransaction pt
WHERE pt.status = 'SUCCESS'
  AND NOT (pt.method = 'VNPAY' AND pt.type = 'WALLET')
""")
    BigDecimal sumAll();

    @Query("""
    SELECT COALESCE(SUM(pt.amount), 0)
    FROM PaymentTransaction pt
    WHERE pt.status = 'SUCCESS'
      AND NOT (pt.method = 'VNPAY' AND pt.type = 'WALLET')
      AND FUNCTION('YEAR', pt.createdAt) = :year
      AND FUNCTION('MONTH', pt.createdAt) = :month
    """)
    BigDecimal sumRevenueByMonth(@Param("year") int year,
                                 @Param("month") int month);

    @Query("""
    SELECT COALESCE(SUM(pt.amount), 0)
    FROM PaymentTransaction pt
    JOIN ChargingSession cs ON pt.referenceId = cs.id
    WHERE cs.station.id = :stationId
      AND pt.type = 'CHARGING-SESSION'
      AND pt.status = 'SUCCESS'
      AND NOT (pt.method = 'VNPAY' AND pt.type = 'WALLET')
    """)
    BigDecimal sumRevenueByStation(Long stationId);

    @Query("SELECT p FROM PaymentTransaction p JOIN Reservation r ON p.referenceId = r.id WHERE r.station.id = :stationId AND p.type = 'RESERVATION'")
    List<PaymentTransaction> findReservationPaymentsByStation(@Param("stationId") Long stationId);

    @Query("SELECT p FROM PaymentTransaction p JOIN ChargingSession s ON p.referenceId = s.id WHERE s.station.id = :stationId AND p.type = 'CHARGING-SESSION'")
    List<PaymentTransaction> findSessionPaymentsByStation(@Param("stationId") Long stationId);
}
