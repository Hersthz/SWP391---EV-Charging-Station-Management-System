package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.request.KycSubmissionRequest;
import com.pham.basis.evcharging.model.KycSubmission;

import java.util.List;


public interface KycService {
    public KycSubmission submitKyc(KycSubmissionRequest req);
    public KycSubmission findByUserId(Long userId);
    public List<KycSubmission> getAll();
}
