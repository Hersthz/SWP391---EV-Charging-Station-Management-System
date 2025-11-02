package com.pham.basis.evcharging.model;


import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_transactions")
@Getter @Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "txn_ref", unique = true, nullable = false)
    private String txnRef;

    @Column(nullable = false)
    private BigDecimal amount;

    private String orderInfo;

    private String vnpTransactionNo;

    @Column(length = 20)
    private String status; // PENDING, SUCCESS, FAILED

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @Column(length = 50, nullable = false)
    private String type; // RESERVATION, CHARGING-SESSION, WALLET(TOP UP), SUBSCRIPTION

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(length = 50, nullable = false)
    private String method;// VNPAY, WALLET

    // ---Liên kết với bảng users---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

}