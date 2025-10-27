package com.pham.basis.evcharging.service;


import com.pham.basis.evcharging.dto.request.KycSubmissionRequest;
import com.pham.basis.evcharging.exception.GlobalExceptionHandler;
import com.pham.basis.evcharging.model.KycSubmission;
import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.repository.KycRepository;
import com.pham.basis.evcharging.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import javax.swing.text.html.Option;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class KycServiceImpl implements KycService {

    private final UserRepository userRepository;
    private final KycRepository kycRepository;

    @Override
    public KycSubmission submitKyc(KycSubmissionRequest req) {
        User user = userRepository.findById(req.getUserId())
                .orElseThrow(() -> new GlobalExceptionHandler.BadRequestException("User not found"));

        KycSubmission kyc = KycSubmission.builder()
                .user(user)
                .frontImageUrl(req.getFrontImageUrl())
                .backImageUrl(req.getBackImageUrl())
                .status("PENDING")
                .build();

        return kycRepository.save(kyc);
    }

    @Override
    public KycSubmission findByUserId(Long userId) {
        return kycRepository.findByUserId(userId)
                .orElseThrow(() -> new EntityNotFoundException("KYC submission not found for user id: " + userId));
    }

    @Override
    public Page<KycSubmission> getAll(Integer page, Integer size) {
        Pageable pageable = PageRequest.of(page, size);
        return kycRepository.findAll(pageable);
    }

    @Override
    public KycSubmission updateKyc(Long id, String status, String reason) {
        if (!isValidStatus(status)) {
            throw new IllegalArgumentException("Invalid status: " + status);
        }

        return kycRepository.findById(id)
                .map(kyc -> {
                    kyc.setStatus(status);
                    kyc.setUpdatedAt(LocalDateTime.now());
                    kyc.setRejectionReason(reason);
                    return kycRepository.save(kyc);
                })
                .orElseThrow(() -> new GlobalExceptionHandler.ResourceNotFoundException("KYC submission not found with id: " + id));
    }

    private boolean isValidStatus(String status) {
        return Arrays.asList("APPROVED", "REJECTED").contains(status);
    }


}
