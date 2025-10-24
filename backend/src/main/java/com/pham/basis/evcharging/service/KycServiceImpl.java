package com.pham.basis.evcharging.service;


import com.pham.basis.evcharging.dto.request.KycSubmissionRequest;
import com.pham.basis.evcharging.exception.GlobalExceptionHandler;
import com.pham.basis.evcharging.model.KycSubmission;
import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.repository.KycRepository;
import com.pham.basis.evcharging.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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
    public List<KycSubmission> getAll() {
        return kycRepository.findAll();
    }


}
