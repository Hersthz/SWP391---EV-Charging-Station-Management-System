package com.pham.basis.evcharging.repository;

import com.pham.basis.evcharging.model.PaymentTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;
@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction,Long> {

    // Check if transaction reference already exists
    boolean existsByTxnRef(String txnRef);

    // Find transaction by reference
    Optional<PaymentTransaction> findByTxnRef(String txnRef);

    // Find pending transaction by reservation and amount
    @Query("SELECT pt FROM PaymentTransaction pt WHERE pt.type = :type AND pt.referenceId = :referenceId AND pt.user.id = :userId AND pt.amount = :amount AND pt.status = 'PENDING'")
    Optional<PaymentTransaction> findPendingByTypeAndReference(
            @Param("type") String type,
            @Param("referenceId") Long referenceId,
            @Param("userId") Long userId,
            @Param("amount") BigDecimal amount
    );

    Page<PaymentTransaction> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Optional<PaymentTransaction> findByReferenceId(Long ReferenceId);
}
