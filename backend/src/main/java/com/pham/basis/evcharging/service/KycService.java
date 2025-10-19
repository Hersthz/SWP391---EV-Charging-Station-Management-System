package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.request.KycSubmissionRequest;
import com.pham.basis.evcharging.model.KycSubmission;


public interface KycService {
    public KycSubmission submitKyc(KycSubmissionRequest req);
}
