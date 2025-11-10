package com.pham.basis.evcharging.service.Impl;

import com.pham.basis.evcharging.dto.request.RedeemVoucherRequest;
import com.pham.basis.evcharging.dto.response.*;
import com.pham.basis.evcharging.model.*;
import com.pham.basis.evcharging.repository.*;
import com.pham.basis.evcharging.service.LoyaltyPointService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LoyaltyPointServiceImpl implements LoyaltyPointService {

    private final UserRepository userRepository;
    private final LoyaltyPointRepository pointRepository;
    private final VoucherRepository voucherRepository;
    private final UserVoucherRepository userVoucherRepository;

    @Override
    public void addPointsAfterCharging(Long userId, BigDecimal chargedAmount) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        BigDecimal divisor = new BigDecimal("10000");
        int points = chargedAmount.divide(divisor, 0, RoundingMode.FLOOR).intValue();

        if (points > 0) {
            LoyaltyPoint lp = new LoyaltyPoint();
            lp.setUser(user);
            lp.setPointsEarned(points);
            pointRepository.save(lp);

            user.setTotalPoints(user.getTotalPoints() + points);
            userRepository.save(user);
        }
    }

    @Override
    public List<LoyaltyPointResponse> getPointHistory(Long userId) {
        return pointRepository.findByUserId(userId)
                .stream()
                .map(p -> {
                    BigDecimal chargedAmount = null;
                    if (p.getSession() != null) {
                        chargedAmount = p.getSession().getChargedAmount();
                        // Log để debug
                        System.out.println("Session ID: " + p.getSession().getId() +
                                ", ChargedAmount: " + chargedAmount);
                    } else {
                        System.out.println("Session is NULL for point ID: " + p.getId());
                    }

                    return new LoyaltyPointResponse(
                            p.getPointsEarned(),
                            chargedAmount,
                            p.getCreatedAt());
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<VoucherResponse> getAvailableVouchers() {
        return voucherRepository.findAll()
                .stream()
                .filter(v -> "ACTIVE".equalsIgnoreCase(v.getStatus()))
                .map(v -> new VoucherResponse(
                        v.getId(),
                        v.getCode(),
                        v.getDescription(),
                        v.getDiscountAmount(),
                        v.getRequiredPoints()))
                .collect(Collectors.toList());
    }

    @Override
    public void redeemVoucher(RedeemVoucherRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Voucher voucher = voucherRepository.findById(request.getVoucherId())
                .orElseThrow(() -> new RuntimeException("Voucher not found"));

        if (user.getTotalPoints() < voucher.getRequiredPoints())
            throw new RuntimeException("Not enough points to redeem");

        user.setTotalPoints(user.getTotalPoints() - voucher.getRequiredPoints());
        userRepository.save(user);

        UserVoucher userVoucher = new UserVoucher();
        userVoucher.setUser(user);
        userVoucher.setVoucher(voucher);
        userVoucherRepository.save(userVoucher);
    }

    @Override
    public List<UserVoucherResponse> getUserVouchers(Long userId) {
        return userVoucherRepository.findByUserId(userId)
                .stream()
                .map(uv -> new UserVoucherResponse(
                        uv.getVoucher().getCode(),
                        uv.getVoucher().getDescription(),
                        uv.getVoucher().getDiscountAmount(),
                        uv.getUsedAt(),
                        uv.isUsed()))
                .collect(Collectors.toList());
    }
}
