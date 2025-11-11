package com.pham.basis.evcharging.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private int requiredPoints;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;

    // Trạng thái lưu dưới dạng String: "ACTIVE", "INACTIVE", "EXPIRED"
    @Column(length = 20)
    private String status;

    public Voucher(String code, Double discountAmount, int requiredPoints, String description, LocalDate startDate, LocalDate endDate, String status) {
        this.code = code;
        this.discountAmount = discountAmount;
        this.requiredPoints = requiredPoints;
        this.description = description;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status;
    }
}
