package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.request.EstimateRequest;
import com.pham.basis.evcharging.dto.response.EstimateResponse;
import com.pham.basis.evcharging.model.ChargerPillar;
import com.pham.basis.evcharging.model.Connector;
import com.pham.basis.evcharging.model.Vehicle;
import com.pham.basis.evcharging.repository.ChargerPillarRepository;
import com.pham.basis.evcharging.repository.ConnectorRepository;
import com.pham.basis.evcharging.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class ChargingEstimatorService {

    private final VehicleRepository vehicleRepo;
    private final ConnectorRepository connectorRepo;
    private final ChargerPillarRepository pillarRepo;

    // DC taper multipliers (the 3-segment approximation)
    private static final double M1 = 1.0;    // 10..60% (we treat 0..60% as full)
    private static final double M2 = 0.7;    // 60..80%
    private static final double M3 = 0.35;   // 80..100%

    private static final double DEFAULT_EFFICIENCY = 0.90;


    public EstimateResponse estimate(EstimateRequest req) {
        // load vehicle
        Vehicle v = vehicleRepo.findById(req.getVehicleId())
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found: " + req.getVehicleId()));

        // load connector
        Connector c = connectorRepo.findById(req.getConnectorId())
                .orElseThrow(() -> new IllegalArgumentException("Connector not found: " + req.getConnectorId()));

        // determine pillar: prefer explicit pillarId if provided, otherwise use connector.pillar
        ChargerPillar pillar = null;
        if (req.getPillarId() != null) {
            pillar = pillarRepo.findById(req.getPillarId())
                    .orElseThrow(() -> new IllegalArgumentException("Pillar not found: " + req.getPillarId()));
        } else {
            pillar = c.getPillar();
            if (pillar == null) {
                throw new IllegalArgumentException("Pillar info missing for connector: " + req.getConnectorId());
            }
        }

        // clamp soc
        double s0 = clamp(req.getSocNow() == null ? 0.0 : req.getSocNow(), 0.0, 1.0);
        double s1 = clamp(req.getSocTarget() == null ? 1.0 : req.getSocTarget(), 0.0, 1.0);

        if (s1 <= s0) {
            // avoid zero-length: bump target by 5 percentage points up to 1.0
            s1 = Math.min(1.0, s0 + 0.05);
        }

        // efficiency fallback
        double eff = v.getEfficiency() == null ? DEFAULT_EFFICIENCY : v.getEfficiency();

        // energy needed into the battery (kWh)
        double batteryKwh = v.getBatteryCapacityKwh();
        if (batteryKwh <= 0) throw new IllegalArgumentException("Vehicle battery capacity invalid");
        double energyKwh = batteryKwh * (s1 - s0);

        // decide AC or DC from connector type
        boolean isAc = isAcType(c.getType());

        // vehicle limit (AC or DC)
        double vehicleLimitKw = isAc ? safeDouble(v.getAcMaxKw()) : safeDouble(v.getDcMaxKw());
        if (vehicleLimitKw <= 0) throw new IllegalArgumentException("Vehicle limit (AC/DC) invalid or zero");

        // pillar power (we keep power at pillar as agreed)
        Double pillarPowerObj = pillar.getPower();
        double pillarPowerKw = pillarPowerObj == null ? Double.POSITIVE_INFINITY : pillarPowerObj;

        // peak before efficiency
        double peakBeforeEff = Math.min(vehicleLimitKw, pillarPowerKw);
        double pPeak = peakBeforeEff * eff;

        if (!(pPeak > 0)) {
            throw new IllegalArgumentException("Peak power is zero or unavailable");
        }

        double pAvg;
        if (isAc) {
            // AC: flat power
            pAvg = pPeak;
        } else {
            // DC: apply taper weighted average between s0->s1
            double weightedMultiplier = dcWeightedMultiplier(s0, s1);
            pAvg = pPeak * weightedMultiplier;
        }

        // avoid division by zero
        double hours = energyKwh / Math.max(1e-6, pAvg);
        int minutes = (int) Math.ceil(hours * 60.0);

        // advice: add 10% buffer
        int buffer = (int) Math.ceil(minutes * 0.10);
        String advice = String.format("Ước tính %d phút. Gợi ý đặt %d phút (thêm %d phút dự phòng).",
                minutes, minutes + buffer, buffer);

        // rounding energy to 2 decimals for neatness
        double energyRounded = round(energyKwh, 2);

        return new EstimateResponse(energyRounded, minutes, advice);
    }

    // Helpers

    private static double clamp(double v, double lo, double hi) {
        return Math.max(lo, Math.min(hi, v));
    }

    private static double safeDouble(Double d) {
        return d == null ? 0.0 : d;
    }

    private static boolean isAcType(String type) {
        if (type == null) return false;
        String t = type.trim().toUpperCase();
        return t.equals("AC") || t.equals("TYPE2") || t.equals("TYPE_2") || t.equals("TYPE-2");
    }

    /**
     * Compute weighted multiplier for DC taper on SOC interval [s0, s1].
     * Segments:
     * 0.00 - 0.60 => multiplier = M1 (1.0)
     * 0.60 - 0.80 => multiplier = M2 (0.7)
     * 0.80 - 1.00 => multiplier = M3 (0.35)
     *
     * weighted = sum(segment_overlap * multiplier) / totalInterval
     */
    private static double dcWeightedMultiplier(double s0, double s1) {
        double total = s1 - s0;
        if (total <= 0) return 1.0;
        double sum = 0.0;

        // seg1: [0.0, 0.60)
        double a1 = Math.max(0.0, Math.min(0.60, s1) - Math.max(0.0, s0));
        sum += a1 * M1;

        // seg2: [0.60, 0.80)
        double a2 = Math.max(0.0, Math.min(0.80, s1) - Math.max(0.60, s0));
        sum += a2 * M2;

        // seg3: [0.80, 1.00]
        double a3 = Math.max(0.0, Math.min(1.0, s1) - Math.max(0.80, s0));
        sum += a3 * M3;

        return sum / total;
    }

    private static double round(double v, int places) {
        if (places < 0) throw new IllegalArgumentException();
        BigDecimal bd = BigDecimal.valueOf(v);
        bd = bd.setScale(places, RoundingMode.HALF_UP);
        return bd.doubleValue();
    }
}
