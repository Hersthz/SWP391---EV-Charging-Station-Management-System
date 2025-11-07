package com.pham.basis.evcharging.controller;


import com.pham.basis.evcharging.dto.request.KycSubmissionRequest;
import com.pham.basis.evcharging.dto.response.ApiResponse;
import com.pham.basis.evcharging.dto.response.KycStatusResponse;
import com.pham.basis.evcharging.dto.response.KycSubmissionResponse;
import com.pham.basis.evcharging.model.KycSubmission;
import com.pham.basis.evcharging.service.KycService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/kyc")
public class KycController {
    private final KycService kycService;

    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<KycSubmissionResponse>> submitKyc(@Valid @RequestBody KycSubmissionRequest request) {
        KycSubmission saved = kycService.submitKyc(request);
        return ResponseEntity.ok(
                new ApiResponse<>(
                        "200",
                        "KYC submitted successfully. Please wait for verification.",
                        toResponse(saved)
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
    public ResponseEntity<ApiResponse<Page<KycSubmissionResponse>>> getAllKyc(
            @RequestParam Integer page,
            @RequestParam Integer size
    ) {
        Page<KycSubmissionResponse> kycPage = kycService.getAll(page, size)
                .map(this::toResponse);
        return ResponseEntity.ok(
                new ApiResponse<>("200", "KYC found", kycPage)
        );
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<KycSubmissionResponse>> updateKyc(
            @PathVariable("id") Long kycId,
            @RequestParam("status") String status,
            @RequestParam(value = "reason", required = false) String reason
    ) {
        KycSubmission kyc = kycService.updateKyc(kycId, status, reason);
        return ResponseEntity.ok(
                new ApiResponse<>(
                        "200",
                        "Update status successfully",
                        toResponse(kyc)
                )
        );
    }

    public KycSubmissionResponse toResponse(KycSubmission kyc) {
        return KycSubmissionResponse.builder()
                .id(kyc.getId())
                .userId(kyc.getUser().getId())
                .frontImageUrl(kyc.getFrontImageUrl())
                .backImageUrl(kyc.getBackImageUrl())
                .status(kyc.getStatus())
                .rejectionReason(kyc.getRejectionReason())
                .createdAt(kyc.getCreatedAt())
                .updatedAt(kyc.getUpdatedAt())
                .build();
    }
}
