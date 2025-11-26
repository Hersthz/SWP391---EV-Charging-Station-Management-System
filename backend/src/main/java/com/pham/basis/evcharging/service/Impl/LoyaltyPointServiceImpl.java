package com.pham.basis.evcharging.service.Impl;

import com.pham.basis.evcharging.dto.request.RedeemVoucherRequest;
import com.pham.basis.evcharging.dto.response.*;
import com.pham.basis.evcharging.model.*;
import com.pham.basis.evcharging.repository.*;
import com.pham.basis.evcharging.exception.AppException;
import com.pham.basis.evcharging.service.LoyaltyPointService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LoyaltyPointServiceImpl implements LoyaltyPointService {

    private final UserRepository userRepository;
    private final LoyaltyPointRepository pointRepository;
    private final VoucherRepository voucherRepository;
    private final UserVoucherRepository userVoucherRepository;
    private final ChargingSessionRepository chargingSessionRepository;
    @Override
    public void addPointsAfterCharging(Long userId, BigDecimal chargedAmount, Long sessionId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ChargingSession session = chargingSessionRepository.findById(sessionId).orElseThrow(()->new RuntimeException("Session not found"));
        BigDecimal divisor = new BigDecimal("10000");
        int points = chargedAmount.divide(divisor, 0, RoundingMode.FLOOR).intValue();

        if (points > 0) {
            LoyaltyPoint lp = new LoyaltyPoint();
            lp.setUser(user);
            lp.setSession(session);
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
    @Transactional
    public void redeemVoucher(RedeemVoucherRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new AppException.NotFoundException("User not found"));
        Voucher voucher = voucherRepository.findById(request.getVoucherId())
                .orElseThrow(() -> new AppException.NotFoundException("Voucher not found"));

        // Kiểm tra voucher còn số lượng
        if (voucher.getQuantity() <= 0) {
            throw new AppException.BadRequestException("Not enough voucher quantity");
        }

        // Kiểm tra user đủ điểm
        if (user.getTotalPoints() < voucher.getRequiredPoints()) {
            throw new AppException.BadRequestException("Not enough points to redeem");
        }

        // Kiểm tra voucher còn hiệu lực
        LocalDate today = LocalDate.now();
        if (!"ACTIVE".equalsIgnoreCase(voucher.getStatus())) {
            throw new AppException.BadRequestException("Voucher is not active");
        }

        if (today.isBefore(voucher.getStartDate()) || today.isAfter(voucher.getEndDate())) {
            throw new AppException.BadRequestException("Voucher expired or not yet available");
        }

        // Trừ điểm của user
        user.setTotalPoints(user.getTotalPoints() - voucher.getRequiredPoints());
        userRepository.save(user);

        // Giảm số lượng voucher chung
        voucher.setQuantity(voucher.getQuantity() - 1);
        voucherRepository.save(voucher);
        
        // Tạo UserVoucher (voucher của user đã thu thập)
        UserVoucher userVoucher = new UserVoucher();
        userVoucher.setUser(user);
        userVoucher.setVoucher(voucher);
        userVoucher.setUsed(false); // Chưa dùng
        userVoucher.setRedeemedAt(LocalDateTime.now()); // Thời điểm redeem

        userVoucherRepository.save(userVoucher);
    }

    @Override
    public List<UserVoucherResponse> getUserVouchers(Long userId) {
        return userVoucherRepository.findAllByUser_Id(userId)
                .stream()
                .map(uv -> UserVoucherResponse.builder()
                        .id(uv.getId()) // ID của UserVoucher
                        .code(uv.getVoucher().getCode())
                        .description(uv.getVoucher().getDescription())
                        .discountAmount(uv.getVoucher().getDiscountAmount())
                        .discountType(uv.getVoucher().getDiscountType())
                        .redeemedAt(uv.getRedeemedAt()) // Thời điểm redeem, không phải usedAt
                        .used(uv.isUsed())
                        .build())
                .toList();
    }
}
