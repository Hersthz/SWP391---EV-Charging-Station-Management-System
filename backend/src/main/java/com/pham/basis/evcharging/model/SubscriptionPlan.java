package com.pham.basis.evcharging.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class SubscriptionPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "plan_id")
    private Long id; // plan_id (PK) [web:15]

    @Column(name = "name", nullable = false, length = 50, unique = true)
    private String name; // Varchar(50) NOT NULL [web:3][web:5]


    @Column(name = "price", nullable = false)
    private double price; // Decimal(10,2) NOT NULL [web:15]


    @Column(name = "billing_cycle", nullable = false, length = 10)
    private String billingCycle; // Varchar(10) NOT NULL (e.g., MONTHLY) [web:3][web:5]


    @Column(name = "included_kwh", nullable = false)
    private double includedKwh; // Decimal(10,2) NOT NULL [web:15]

    @Column(name = "description")
    private String description; // Text (nullable) [web:15]

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, columnDefinition = "timestamp with time zone")
    private LocalDateTime createdAt;
}
