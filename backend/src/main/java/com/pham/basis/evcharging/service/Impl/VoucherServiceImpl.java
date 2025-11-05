package com.pham.basis.evcharging.service.Impl;

import com.pham.basis.evcharging.dto.request.VoucherApplyRequest;
import com.pham.basis.evcharging.dto.request.VoucherRequest;
import com.pham.basis.evcharging.dto.response.UserVoucherResponse;
import com.pham.basis.evcharging.dto.response.VoucherApplyResponse;
import com.pham.basis.evcharging.dto.response.VoucherResponse;
import com.pham.basis.evcharging.exception.AppException;
import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.model.UserVoucher;
import com.pham.basis.evcharging.model.Voucher;
import com.pham.basis.evcharging.repository.UserVoucherRepository;
import com.pham.basis.evcharging.repository.VoucherRepository;
import com.pham.basis.evcharging.service.VoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VoucherServiceImpl implements VoucherService {

    private final VoucherRepository voucherRepository;
    private final UserVoucherRepository userVoucherRepository;

    // CRUD cho Voucher

    private VoucherResponse mapToResponse(Voucher voucher) {
        return VoucherResponse.builder()
                .id(voucher.getId())
                .code(voucher.getCode())
                .discountPercent(voucher.getDiscountPercent())
                .discountAmount(voucher.getDiscountAmount())
                .maxUses(voucher.getMaxUses())
                .usedCount(voucher.getUsedCount())
                .startDate(voucher.getStartDate())
                .endDate(voucher.getEndDate())
                .status(voucher.getStatus())
                .build();
    }

    @Override
    public List<VoucherResponse> getAllVouchers() {
        return voucherRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<VoucherResponse> getVoucherById(Long id) {
        return voucherRepository.findById(id).map(this::mapToResponse);
    }

    @Override
    public Optional<VoucherResponse> getVoucherByCode(String code) {
        return voucherRepository.findByCode(code).map(this::mapToResponse);
    }

    @Override
    public VoucherResponse createVoucher(VoucherRequest req) {
        // Kiểm tra trùng code
        if (voucherRepository.findByCode(req.getCode()).isPresent()) {
            throw new AppException.BadRequestException("Voucher code already exists");
        }

        Voucher voucher = new Voucher(
                req.getCode(),
                req.getDiscountPercent(),
                req.getDiscountAmount(),
                req.getMaxUses(),
                0,
                req.getStartDate(),
                req.getEndDate(),
                req.getStatus()
        );
        return mapToResponse(voucherRepository.save(voucher));
    }

    @Override
    public VoucherResponse updateVoucher(Long id, VoucherRequest req) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new AppException.NotFoundException("Voucher not found"));

        voucher.setCode(req.getCode());
        voucher.setDiscountPercent(req.getDiscountPercent());
        voucher.setDiscountAmount(req.getDiscountAmount());
        voucher.setMaxUses(req.getMaxUses());
        voucher.setStartDate(req.getStartDate());
        voucher.setEndDate(req.getEndDate());
        voucher.setStatus(req.getStatus());

        return mapToResponse(voucherRepository.save(voucher));
    }

    @Override
    public void deleteVoucher(Long id) {
        if (!voucherRepository.existsById(id)) {
            throw new AppException.NotFoundException("Voucher not found");
        }
        voucherRepository.deleteById(id);
    }


    // Apply voucher cho user


    @Override
    public VoucherApplyResponse applyVoucher(VoucherApplyRequest req) {
        Voucher voucher = voucherRepository.findByCode(req.getCode())
                .orElseThrow(() -> new AppException.NotFoundException("Voucher not found"));

        LocalDate today = LocalDate.now();

        if (!"ACTIVE".equalsIgnoreCase(voucher.getStatus()))
            return new VoucherApplyResponse("Voucher is not active", 0, req.getTotalAmount());

        if (today.isBefore(voucher.getStartDate()) || today.isAfter(voucher.getEndDate()))
            return new VoucherApplyResponse("Voucher expired", 0, req.getTotalAmount());

        if (voucher.getUsedCount() >= voucher.getMaxUses())
            return new VoucherApplyResponse("Voucher usage limit reached", 0, req.getTotalAmount());

        Optional<UserVoucher> userVoucherOpt = userVoucherRepository.findByUserIdAndVoucherId(req.getUserId(), voucher.getId());
        if (userVoucherOpt.isPresent() && userVoucherOpt.get().isUsed())
            return new VoucherApplyResponse("User has already used this voucher", 0, req.getTotalAmount());

        double discount = 0;
        if (voucher.getDiscountPercent() != null)
            discount = req.getTotalAmount() * voucher.getDiscountPercent() / 100.0;
        else if (voucher.getDiscountAmount() != null)
            discount = voucher.getDiscountAmount();

        double finalPrice = Math.max(req.getTotalAmount() - discount, 0);

        voucher.setUsedCount(voucher.getUsedCount() + 1);
        if (voucher.getUsedCount() >= voucher.getMaxUses())
            voucher.setStatus("EXPIRED");
        voucherRepository.save(voucher);

        UserVoucher userVoucher = userVoucherOpt.orElseGet(UserVoucher::new);
        User user = new User();
        user.setId(req.getUserId());
        userVoucher.setUser(user);
        userVoucher.setVoucherId(voucher.getId());
        userVoucher.setUsed(true);
        userVoucher.setUsedAt(LocalDateTime.now());
        userVoucherRepository.save(userVoucher);

        return new VoucherApplyResponse("Voucher applied successfully", discount, finalPrice);
    }

    //Danh sách voucher user đã dùng

    @Override
    public List<UserVoucherResponse> getUserVouchers(Long userId) {
        return userVoucherRepository.findAllByUserId(userId)
                .stream()
                .map(uv -> UserVoucherResponse.builder()
                        .voucherCode(uv.getVoucher().getCode())
                        .discountPercent(uv.getVoucher().getDiscountPercent())
                        .discountAmount(uv.getVoucher().getDiscountAmount())
                        .status(uv.getVoucher().getStatus())
                        .used(uv.isUsed())
                        .usedAt(uv.getUsedAt())
                        .build())
                .collect(Collectors.toList());
    }
}
