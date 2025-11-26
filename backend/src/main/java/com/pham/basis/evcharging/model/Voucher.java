package com.pham.basis.evcharging.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.AssertTrue;
import java.time.LocalDate;

@Entity
@Table(name = "vouchers")
@Data
@NoArgsConstructor
public class Voucher {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "voucher_id")
    private Long id;

    @Column(unique = true, nullable = false)
    private String code;

    private Double discountAmount;
    // giảm theo PERCENT hoặc trừ theo AMOUNT
    private String discountType;
    private int requiredPoints;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private int quantity;

    // Trạng thái lưu dưới dạng String: "ACTIVE", "INACTIVE", "EXPIRED"
    @Column(length = 20)
    private String status;

    @AssertTrue(message = "Percentage discount must be between 1% and 100%")
    private boolean isValidDiscount() {
        if ("PERCENT".equalsIgnoreCase(discountType)) {
            return discountAmount != null && discountAmount >= 1 && discountAmount <= 100;
        }
        return true; // Không validate nếu là FIXED
    }

    public Voucher(String code, Double discountAmount, String discountType, int requiredPoints, String description, LocalDate startDate, LocalDate endDate, int quantity, String status) {
        this.code = code;
        this.discountAmount = discountAmount;
        this.discountType = discountType;
        this.requiredPoints = requiredPoints;
        this.description = description;
        this.startDate = startDate;
        this.endDate = endDate;
        this.quantity = quantity;
        this.status = status;
    }
}
