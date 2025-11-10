package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.request.EstimateRequest;
import com.pham.basis.evcharging.dto.response.EstimateResponse;
import com.pham.basis.evcharging.exception.AppException;
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

    private static final double DEFAULT_EFFICIENCY = 0.90;

    public EstimateResponse estimate(EstimateRequest req) {
        // Load vehicle
        Vehicle v = vehicleRepo.findById(req.getVehicleId())
                .orElseThrow(() -> new AppException.NotFoundException("Vehicle not found: " + req.getVehicleId()));
        // Load connector
        Connector c = connectorRepo.findById(req.getConnectorId())
                .orElseThrow(() -> new  AppException.NotFoundException("Connector not found: " + req.getConnectorId()));

        // Determine pillar
        ChargerPillar pillar = (req.getPillarId() != null)
                ? pillarRepo.findById(req.getPillarId()).orElseThrow(() -> new  AppException.NotFoundException("Pillar not found: " + req.getPillarId()))
                : c.getPillar();

        if (pillar == null) {
            throw new IllegalArgumentException("Pillar info missing for connector: " + req.getConnectorId());
        }

        // lay soc
        double s0 = req.getSocNow() == null ? 0.0 : req.getSocNow();
        s0 = Math.max(0.0, Math.min(1.0, s0));
        double s1 = req.getSocTarget() == null ? 1.0 : req.getSocTarget();
        s1 = Math.max(0.0, Math.min(1.0, s1));

        if (s1 <= s0) {
            s1 = Math.min(1.0, s0 + 0.05);
        }

        // Efficiency
        double eff = v.getEfficiency() == null ? DEFAULT_EFFICIENCY : v.getEfficiency();

        // Energy cần nạp vào pin
        Double batteryKwhObj = v.getBatteryCapacityKwh();
        if (batteryKwhObj == null || batteryKwhObj <= 0)
            throw new IllegalArgumentException("Invalid battery capacity for vehicle: " + v.getId());
        double batteryKwh = batteryKwhObj;

        double energyToBatteryKwh = batteryKwh * (s1 - s0);     // năng lượng thực vào pin
        double energyFromStationKwh = energyToBatteryKwh / eff; // năng lượng cung cấp từ trạm
        double estimatedCost = energyFromStationKwh * pillar.getPricePerKwh();

        // AC / DC check
        String connectorType = c.getType();
        boolean isAc = connectorType != null && (
                connectorType.trim().equalsIgnoreCase("AC") || connectorType.trim().equalsIgnoreCase("TYPE2")
        );

        // vehicle limit
        double vehicleLimitKw = isAc
                ? (v.getAcMaxKw() == null ? 0.0 : v.getAcMaxKw())
                : (v.getDcMaxKw() == null ? 0.0 : v.getDcMaxKw());
        if (vehicleLimitKw <= 0) throw new IllegalArgumentException("Vehicle limit (AC/DC) invalid or zero");

        // pillar power
        Double pillarPowerObj = pillar.getPower();
        if (pillarPowerObj == null || pillarPowerObj <= 0) throw new IllegalArgumentException("Pillar power invalid");
        double pillarPowerKw = pillarPowerObj;

        // peak max
        double peakBeforeEff = Math.min(vehicleLimitKw, pillarPowerKw);
        double pPeak = peakBeforeEff * eff;
        if (!(pPeak > 0)) throw new IllegalArgumentException("Peak power is zero or unavailable");

        //peak thời gian
        int estimatedMinutes = (int) Math.ceil((energyToBatteryKwh / pPeak) * 60.0);

        // Buffer 10% và advice
        int buffer = (int) Math.ceil(estimatedMinutes * 0.10);
        String advice = String.format(
                "Estimated to take %d minutes to fully charge. Suggested booking: %d minutes (including %d minutes buffer).",
                estimatedMinutes, estimatedMinutes + buffer, buffer
        );

        // Round hiển thị
        double energyToBatteryRounded = round(energyToBatteryKwh, 2);
        double energyFromStationRounded = round(energyFromStationKwh, 2);
        double estimatedCostRounded = round(estimatedCost, 2);

        return EstimateResponse.builder()
                .estimatedCost(estimatedCostRounded)
                .estimatedMinutes(estimatedMinutes)
                .advice(advice)
                .energyFromStationKwh(energyFromStationRounded)
                .energyKwh(energyToBatteryRounded)
                .build();
    }

    // helper round
    private static double round(double v, int places) {
        if (places < 0) throw new IllegalArgumentException();
        BigDecimal bd = BigDecimal.valueOf(v);
        bd = bd.setScale(places, RoundingMode.HALF_UP);
        return bd.doubleValue();
    }
}
