package com.pham.basis.evcharging.service;


import com.pham.basis.evcharging.dto.request.RedeemVoucherRequest;
import com.pham.basis.evcharging.dto.response.LoyaltyPointResponse;
import com.pham.basis.evcharging.dto.response.UserVoucherResponse;
import com.pham.basis.evcharging.dto.response.VoucherResponse;

import java.math.BigDecimal;
import java.util.List;

public interface LoyaltyPointService {
    void addPointsAfterCharging(Long sessionId, BigDecimal chargedAmount);
    List<LoyaltyPointResponse> getPointHistory(Long userId);
    List<VoucherResponse> getAvailableVouchers();
    void redeemVoucher(RedeemVoucherRequest request);
    List<UserVoucherResponse> getUserVouchers(Long userId);
}
