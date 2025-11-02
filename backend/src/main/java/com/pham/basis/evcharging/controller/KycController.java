package com.pham.basis.evcharging.controller;


import com.pham.basis.evcharging.dto.request.KycSubmissionRequest;
import com.pham.basis.evcharging.dto.response.ApiResponse;
import com.pham.basis.evcharging.dto.response.KycStatusResponse;
import com.pham.basis.evcharging.model.KycSubmission;
import com.pham.basis.evcharging.service.KycService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/kyc")
public class KycController {
    private final KycService kycService;

    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<KycSubmission>> submitKyc(@Valid @RequestBody KycSubmissionRequest request) {
        KycSubmission saved = kycService.submitKyc(request);
        return ResponseEntity.ok(
                new ApiResponse<>(
                        "200",
                        "KYC submitted successfully. Please wait for verification.",
                        saved
                )
        );
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<KycStatusResponse>> getKyc(@PathVariable("userId") Long userId) {
        KycSubmission kyc = kycService.findByUserId(userId);
        KycStatusResponse body = new KycStatusResponse(kyc.getStatus());
        return ResponseEntity.ok(
                new ApiResponse<>("200", "KYC found", body)
        );
    }

    @GetMapping("/get-all")
    public ResponseEntity<ApiResponse<Page<KycSubmission>>> getAllKyc(@RequestParam Integer page, @RequestParam Integer size) {
        Page<KycSubmission> kyc = kycService.getAll(page, size);
        return ResponseEntity.ok(
                new ApiResponse<>(
                        "200",
                        "KYC found",
                        kyc
                )
        );
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<KycSubmission>> updateKyc(@PathVariable("id") Long kycId, @RequestParam("status") String status, @RequestParam("reason") String reason) {
        KycSubmission kyc = kycService.updateKyc(kycId, status, reason);
        return ResponseEntity.ok(
                new ApiResponse<>(
                        "200","Update status succesfully",kyc
                )
        );
    }
}
