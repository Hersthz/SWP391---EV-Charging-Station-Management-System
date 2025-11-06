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
    private Long id;

    @Column(unique = true, nullable = false)
    private String code;

    private Integer discountPercent;
    private Double discountAmount;
    private Integer maxUses;
    private Integer usedCount = 0;

    private LocalDate startDate;
    private LocalDate endDate;

    // Trạng thái lưu dưới dạng String: "ACTIVE", "INACTIVE", "EXPIRED"
    @Column(length = 20)
    private String status;

    public Voucher(String code, Integer discountPercent, Double discountAmount, Integer maxUses, Integer usedCount, LocalDate startDate, LocalDate endDate, String status) {
        this.code = code;
        this.discountPercent = discountPercent;
        this.discountAmount = discountAmount;
        this.maxUses = maxUses;
        this.usedCount = usedCount;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status;
    }
}
