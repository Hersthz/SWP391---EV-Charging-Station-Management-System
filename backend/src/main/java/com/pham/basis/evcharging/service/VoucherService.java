package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.request.VoucherApplyRequest;
import com.pham.basis.evcharging.dto.request.VoucherRequest;
import com.pham.basis.evcharging.dto.response.UserVoucherResponse;
import com.pham.basis.evcharging.dto.response.VoucherApplyResponse;
import com.pham.basis.evcharging.dto.response.VoucherResponse;
import com.pham.basis.evcharging.model.UserVoucher;
import com.pham.basis.evcharging.model.Voucher;

import java.util.List;
import java.util.Optional;

public interface VoucherService {
    public VoucherApplyResponse applyVoucher(VoucherApplyRequest req);
    public List<UserVoucherResponse> getUserVouchers(Long userId);
    List<VoucherResponse> getAllVouchers();
    Optional<VoucherResponse> getVoucherById(Long id);
    Optional<VoucherResponse> getVoucherByCode(String code);
    VoucherResponse createVoucher(VoucherRequest req);
    VoucherResponse updateVoucher(Long id, VoucherRequest req);
    void deleteVoucher(Long id);
    }
