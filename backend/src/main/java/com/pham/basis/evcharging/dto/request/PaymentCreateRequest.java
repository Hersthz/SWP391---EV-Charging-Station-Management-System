package com.pham.basis.evcharging.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@Builder
public class PaymentCreateRequest {

    @NotNull(message = "amount không được để trống")
    @DecimalMin(value = "0.01", message = "amount phải lớn hơn 0")
    private BigDecimal amount;
    @Size(max = 512)
    private String returnUrl;
    @Pattern(regexp = "vn|en", message = "locale phải 'vn' hoặc 'en'")
    private String locale = "vn";
    @Size(max = 255)
    private String description;
    @NotBlank(message = "type không được để trống")
    private String type;
    private Long referenceId;
    @NotBlank(message = "method không được để trống")
    private String method;
    
    private String voucherCode; // Mã voucher để áp dụng

}
