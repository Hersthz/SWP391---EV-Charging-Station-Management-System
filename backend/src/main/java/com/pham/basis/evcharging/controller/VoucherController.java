package com.pham.basis.evcharging.controller;

import com.pham.basis.evcharging.dto.request.VoucherApplyRequest;
import com.pham.basis.evcharging.dto.request.VoucherRequest;
import com.pham.basis.evcharging.dto.response.ApiResponse;
import com.pham.basis.evcharging.dto.response.UserVoucherResponse;
import com.pham.basis.evcharging.dto.response.VoucherApplyResponse;
import com.pham.basis.evcharging.dto.response.VoucherResponse;
import com.pham.basis.evcharging.model.UserVoucher;
import com.pham.basis.evcharging.service.VoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vouchers")
@RequiredArgsConstructor
public class VoucherController {

    private final VoucherService voucherService;

    //CRUD

    @GetMapping
    public ApiResponse<List<VoucherResponse>> getAllVouchers() {
        return new ApiResponse<>("200", "Get all vouchers successfully", voucherService.getAllVouchers());
    }

    @GetMapping("/{id}")
    public ApiResponse<VoucherResponse> getVoucherById(@PathVariable Long id) {
        return voucherService.getVoucherById(id)
                .map(v -> new ApiResponse<>("200", "Voucher found", v))
                .orElseGet(() -> new ApiResponse<>("404", "Voucher not found", null));
    }

    @GetMapping("/code/{code}")
    public ApiResponse<VoucherResponse> getVoucherByCode(@PathVariable String code) {
        return voucherService.getVoucherByCode(code)
                .map(v -> new ApiResponse<>("200", "Voucher found", v))
                .orElseGet(() -> new ApiResponse<>("404", "Voucher not found", null));
    }

    @PostMapping
    public ApiResponse<VoucherResponse> createVoucher(@RequestBody VoucherRequest request) {
        return new ApiResponse<>("200", "Voucher created successfully", voucherService.createVoucher(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<VoucherResponse> updateVoucher(@PathVariable Long id, @RequestBody VoucherRequest request) {
        return new ApiResponse<>("200", "Voucher updated successfully", voucherService.updateVoucher(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteVoucher(@PathVariable Long id) {
        voucherService.deleteVoucher(id);
        return new ApiResponse<>("200", "Voucher deleted successfully", null);
    }


    // ==================== Apply voucher cho thanh toán ====================

    @PostMapping("/apply")
    public ApiResponse<VoucherApplyResponse> applyVoucher(@RequestBody VoucherApplyRequest request) {
        VoucherApplyResponse response = voucherService.applyVoucher(request);
        return new ApiResponse<>("200", response.getMessage(), response);
    }

    // ==================== Danh sách voucher của user ====================

    @GetMapping("/user/{userId}")
    public ApiResponse<List<UserVoucherResponse>> getUserVouchers(@PathVariable Long userId) {
        return new ApiResponse<>("200", "Get user vouchers successfully", voucherService.getUserVouchers(userId));
    }
}
