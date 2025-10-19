package com.pham.basis.evcharging.controller;


import com.pham.basis.evcharging.dto.request.KycSubmissionRequest;
import com.pham.basis.evcharging.dto.response.ApiResponse;
import com.pham.basis.evcharging.model.KycSubmission;
import com.pham.basis.evcharging.service.KycService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/kyc")
public class KycController {
    private final KycService kycService;

    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<KycSubmission>> submitKyc(
            @RequestBody KycSubmissionRequest request) {

        KycSubmission saved = kycService.submitKyc(request);

        return ResponseEntity.ok(
                new ApiResponse<>(
                        "200",
                        "KYC submitted successfully. Please wait for verification.",
                        saved
                )
        );
    }
}
