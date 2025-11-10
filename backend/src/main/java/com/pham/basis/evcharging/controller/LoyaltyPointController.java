package com.pham.basis.evcharging.controller;

import com.pham.basis.evcharging.dto.request.RedeemVoucherRequest;
import com.pham.basis.evcharging.dto.response.*;
import com.pham.basis.evcharging.service.LoyaltyPointService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/loyalty-point")
@RequiredArgsConstructor
public class LoyaltyPointController {

    private final LoyaltyPointService loyaltyPointService;

    @GetMapping("/history/{userId}")
    public ApiResponse<List<LoyaltyPointResponse>> getHistory(@PathVariable Long userId) {
        List<LoyaltyPointResponse> history = loyaltyPointService.getPointHistory(userId);
        return ApiResponse.<List<LoyaltyPointResponse>>builder()
                .code("200")
                .message("Fetched point history successfully")
                .data(history)
                .build();
    }

    //doi ma giam giá
    @PostMapping("/redeem")
    public ApiResponse<Void> redeem(@RequestBody RedeemVoucherRequest request) {
        loyaltyPointService.redeemVoucher(request);
        return ApiResponse.<Void>builder()
                .code("200")
                .message("Voucher redeemed successfully")
                .build();
    }
}
