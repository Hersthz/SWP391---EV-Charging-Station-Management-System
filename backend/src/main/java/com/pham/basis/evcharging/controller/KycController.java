package com.pham.basis.evcharging.controller;


import com.pham.basis.evcharging.dto.request.KycSubmissionRequest;
import com.pham.basis.evcharging.dto.response.ApiResponse;
import com.pham.basis.evcharging.model.KycSubmission;
import com.pham.basis.evcharging.service.KycService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<KycSubmission>> getKyc(@PathVariable Long userId) {
        KycSubmission kyc = kycService.findByUserId(userId);
        return ResponseEntity.ok(
                new ApiResponse<>(
                        "200",
                        "KYC found",
                        kyc
                )
        );
    }

    @GetMapping("/get-all")
    public ResponseEntity<ApiResponse<List<KycSubmission>>> getAllKyc() {
        List<KycSubmission> kyc = kycService.getAll();
        return ResponseEntity.ok(
                new ApiResponse<>(
                        "200",
                        "KYC found",
                        kyc
                )
        );
    }
}
