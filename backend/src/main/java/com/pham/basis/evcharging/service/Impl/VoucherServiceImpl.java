package com.pham.basis.evcharging.service.Impl;

import com.pham.basis.evcharging.dto.request.VoucherApplyRequest;
import com.pham.basis.evcharging.dto.request.VoucherRequest;
import com.pham.basis.evcharging.dto.response.UserVoucherResponse;
import com.pham.basis.evcharging.dto.response.VoucherApplyResponse;
import com.pham.basis.evcharging.dto.response.VoucherResponse;
import com.pham.basis.evcharging.exception.AppException;
import com.pham.basis.evcharging.model.UserVoucher;
import com.pham.basis.evcharging.model.Voucher;
import com.pham.basis.evcharging.repository.UserVoucherRepository;
import com.pham.basis.evcharging.repository.VoucherRepository;
import com.pham.basis.evcharging.service.VoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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


    // ================= CRUD VOUCHER =================

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
        if (voucherRepository.findByCode(req.getCode()).isPresent()) {
            throw new AppException.BadRequestException("Voucher code already exists");
        }

        // Validate quantity không được < 0
        if (req.getQuantity() < 0) {
            throw new AppException.BadRequestException("Voucher quantity cannot be negative");
        }

        Voucher voucher = new Voucher(
                req.getCode(),
                req.getDiscountAmount(),
                req.getDiscountType(),
                req.getRequiredPoints(),
                req.getDescription(),
                req.getStartDate(),
                req.getEndDate(),
                req.getQuantity(),
                req.getStatus()
        );

        return mapToResponse(voucherRepository.save(voucher));
    }

    @Override
    public VoucherResponse updateVoucher(Long id, VoucherRequest req) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new AppException.NotFoundException("Voucher not found"));

        // Validate quantity không được < 0
        if (req.getQuantity() < 0) {
            throw new AppException.BadRequestException("Voucher quantity cannot be negative");
        }

        voucher.setCode(req.getCode());
        voucher.setDiscountAmount(req.getDiscountAmount());
        voucher.setDiscountType(req.getDiscountType());
        voucher.setRequiredPoints(req.getRequiredPoints());
        voucher.setDescription(req.getDescription());
        voucher.setStartDate(req.getStartDate());
        voucher.setEndDate(req.getEndDate());
        voucher.setQuantity(req.getQuantity());
        voucher.setStatus(req.getStatus());

        return mapToResponse(voucherRepository.save(voucher));
    }

    @Override
    @Transactional
    public void deleteVoucher(Long id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new AppException.NotFoundException("Voucher not found"));
        
        // Tìm tất cả UserVoucher records liên quan đến voucher này
        List<UserVoucher> userVouchers = userVoucherRepository.findAllByVoucher_Id(id);
        
        // Nếu có user đã redeem voucher này, xóa các UserVoucher records trước
        // (để tránh lỗi foreign key constraint)
        if (!userVouchers.isEmpty()) {
            userVoucherRepository.deleteAll(userVouchers);
        }
        
        // Sau đó mới xóa voucher
        voucherRepository.deleteById(id);
    }



    // ================= APPLY VOUCHER =================

    @Transactional
    @Override
    public VoucherApplyResponse applyVoucher(VoucherApplyRequest req) {
        // Tìm UserVoucher từ user_vouchers của user (voucher đã thu thập)
        UserVoucher userVoucher = userVoucherRepository.findByUser_IdAndVoucher_Code(req.getUserId(), req.getCode())
                .orElseThrow(() -> new AppException.NotFoundException("User does not have this voucher"));

        // Kiểm tra user đã dùng voucher này chưa
        if (userVoucher.isUsed()) {
            return new VoucherApplyResponse("User has already used this voucher", 0, req.getTotalAmount());
        }

        // Lấy thông tin voucher từ UserVoucher
        Voucher voucher = userVoucher.getVoucher();
        if (voucher == null) {
            return new VoucherApplyResponse("Voucher information not found", 0, req.getTotalAmount());
        }

        LocalDate today = LocalDate.now();

        // Kiểm tra voucher còn hiệu lực
        if (!"ACTIVE".equalsIgnoreCase(voucher.getStatus())) {
            return new VoucherApplyResponse("Voucher is not active", 0, req.getTotalAmount());
        }

        if (today.isBefore(voucher.getStartDate()) || today.isAfter(voucher.getEndDate())) {
            return new VoucherApplyResponse("Voucher expired", 0, req.getTotalAmount());
        }

        // Tính giảm giá
        double discount = 0;

        if (voucher.getDiscountAmount() != null) {
            if ("AMOUNT".equalsIgnoreCase(voucher.getDiscountType())) {
                discount = voucher.getDiscountAmount();
            } else if ("PERCENT".equalsIgnoreCase(voucher.getDiscountType())) {
                discount = req.getTotalAmount() * voucher.getDiscountAmount() / 100;
            }
        }

        double finalPrice = Math.max(req.getTotalAmount() - discount, 0);

        // Đánh dấu voucher đã được sử dụng
        userVoucher.setUsed(true);
        userVoucher.setUsedAt(LocalDateTime.now());
        userVoucherRepository.save(userVoucher);

        return new VoucherApplyResponse("Voucher applied successfully", discount, finalPrice);
    }



    // ================= USER VOUCHERS =================

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
                        .build()
                ).collect(Collectors.toList());
    }



    // ================= MAPPING =================

    private VoucherResponse mapToResponse(Voucher voucher) {
        return VoucherResponse.builder()
                .voucherId(voucher.getId())
                .code(voucher.getCode())
                .discountAmount(voucher.getDiscountAmount())
                .discountType(voucher.getDiscountType())
                .description(voucher.getDescription())
                .requiredPoints(voucher.getRequiredPoints())
                .startDate(voucher.getStartDate())
                .endDate(voucher.getEndDate())
                .quantity(voucher.getQuantity())
                .status(voucher.getStatus())
                .build();
    }
}
