package com.pham.basis.evcharging.dto.request;

import lombok.Data;

@Data
public class KycSubmissionRequest {
    private Long userId;
    private String frontImageUrl;
    private String backImageUrl;
}
