package com.pham.basis.evcharging.dto.response;

import com.pham.basis.evcharging.model.ChargerPillar;
import com.pham.basis.evcharging.model.Reservation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdjustTargetSocResponse {
    private boolean updated;
    private Reservation reservation;
    private List<ChargerPillar> suggestedPillars;
    private BigDecimal estimatedAmount;
    private boolean walletSufficient;
    private String message;
}