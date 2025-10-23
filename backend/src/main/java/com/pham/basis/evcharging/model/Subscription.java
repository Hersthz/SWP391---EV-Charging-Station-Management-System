package com.pham.basis.evcharging.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "subscriptions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "subscription_id")
    private Long id;

    @ManyToOne(optional = false) // FK -> users.id
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(optional = false) // FK -> subscription_plans.plan_id
    @JoinColumn(name = "plan_id", nullable = false)
    private SubscriptionPlan plan;

    // Không dùng enum: ràng buộc String bằng length/validator
    @Column(name = "status", nullable = false, length = 20)
    private String status; // ACTIVE, CANCELED, EXPIRED, TRIAL

    @NotNull
    @Column(name = "start_date", nullable = false, columnDefinition = "datetime2")
    private LocalDateTime startDate;

    @Column(name = "end_date", columnDefinition = "datetime2")
    private LocalDateTime endDate;

    @NotNull
    @Column(name = "created_at", nullable = false, columnDefinition = "datetime2")
    private LocalDateTime createdAt;

    @Column(name = "price_at_purchase", nullable = false)
    private double priceAtPurchase;
}
