package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.request.KycSubmissionRequest;
import com.pham.basis.evcharging.model.KycSubmission;
import org.springframework.data.domain.Page;


public interface KycService {
    public KycSubmission submitKyc(KycSubmissionRequest req);
    public KycSubmission findByUserId(Long userId);
    public Page<KycSubmission> getAll(Integer page, Integer size);
    public KycSubmission updateKyc(Long id, String status, String reason);
}
