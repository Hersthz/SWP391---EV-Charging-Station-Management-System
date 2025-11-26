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
import com.pham.basis.evcharging.repository.UserRepository;
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
    // CRUD cho Voucher


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
    public void deleteVoucher(Long id) {
        if (!voucherRepository.existsById(id)) {
            throw new AppException.NotFoundException("Voucher not found");
        }
        voucherRepository.deleteById(id);
    }



    // Apply voucher cho user
    @Transactional
    @Override
    public VoucherApplyResponse applyVoucher(VoucherApplyRequest req) {
        Voucher voucher = voucherRepository.findByCode(req.getCode())
                .orElseThrow(() -> new AppException.NotFoundException("Voucher not found"));

        LocalDate today = LocalDate.now();

        // Check trạng thái
        if (!"ACTIVE".equalsIgnoreCase(voucher.getStatus())) {
            return new VoucherApplyResponse("Voucher is not active", 0, req.getTotalAmount());
        }

        // Check hạn sử dụng
        if (today.isBefore(voucher.getStartDate()) || today.isAfter(voucher.getEndDate())) {
            return new VoucherApplyResponse("Voucher expired", 0, req.getTotalAmount());
        }

        // Check user đã dùng chưa
        Optional<UserVoucher> userVoucherOpt =
                userVoucherRepository.findByUserIdAndVoucherId(req.getUserId(), voucher.getId());

        if (userVoucherOpt.isPresent() && userVoucherOpt.get().isUsed()) {
            return new VoucherApplyResponse("User has already used this voucher", 0, req.getTotalAmount());
        }

        // Tính giảm giá
        double discount = 0;
        if (voucher.getDiscountAmount() != null) {
            if ("AMOUNT".equalsIgnoreCase(voucher.getDiscountType())) {
                discount =  voucher.getDiscountAmount();
            }else if("PERCENT".equalsIgnoreCase(voucher.getDiscountType())) {
                discount = req.getTotalAmount() * voucher.getDiscountAmount() / 100;
            }
        }
        double finalPrice = Math.max(req.getTotalAmount() - discount, 0);
        if(finalPrice<0) {
            finalPrice = 0;
        }
        // Đánh dấu voucher là đã sử dụng
        UserVoucher userVoucher = userVoucherOpt.orElseGet(UserVoucher::new);
        User user = new User();
        user.setId(req.getUserId());
        userVoucher.setVoucher(voucher);
        userVoucher.setUser(user);
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
                        .code(uv.getVoucher().getCode())
                        .discountAmount(uv.getVoucher().getDiscountAmount())
                        .used(uv.isUsed())
                        .redeemedAt(uv.getUsedAt())
                        .build())
                .collect(Collectors.toList());
    }


    private VoucherResponse mapToResponse(Voucher voucher) {
        return VoucherResponse.builder()
                .voucherId(voucher.getId())
                .code(voucher.getCode())
                .discountAmount(voucher.getDiscountAmount())
                .description(voucher.getDescription())
                .discountType(voucher.getDiscountType())
                .requiredPoints(voucher.getRequiredPoints())
                .build();
    }

}
