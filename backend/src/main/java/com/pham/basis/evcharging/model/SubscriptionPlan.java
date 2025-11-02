package com.pham.basis.evcharging.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "subscription_plans")
public class SubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "plan_id")
    private Long planId;

    @Column(name = "name", nullable = false, length = 50, unique = true)
    private String name;

    @Column(name = "price", nullable = false)
    private double price;

    @Column(name = "billing_cycle", nullable = false, length = 10)
    private String billingCycle;

    @Column(name = "included_kwh", nullable = false)
    private double includedKwh;

    @Column(name = "description")
    private String description;

    @Column(name = "discount_rate")
    private double discountRate = 0.0;

    @Column(name = "free_booking")
    private Boolean freeBooking = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, columnDefinition = "datetime2")
    private LocalDateTime createdAt;
}
