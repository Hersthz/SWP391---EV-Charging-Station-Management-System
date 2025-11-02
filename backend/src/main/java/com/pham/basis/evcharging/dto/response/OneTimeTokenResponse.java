package com.pham.basis.evcharging.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OneTimeTokenResponse {
    private String token;
    private LocalDateTime expiresAt;
    private String qrUrl;
}
