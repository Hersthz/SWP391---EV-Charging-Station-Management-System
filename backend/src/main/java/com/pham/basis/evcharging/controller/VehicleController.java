package com.pham.basis.evcharging.controller;

import com.pham.basis.evcharging.dto.response.ApiResponse;
import com.pham.basis.evcharging.dto.response.VehicleResponse;
import com.pham.basis.evcharging.model.Vehicle;
import com.pham.basis.evcharging.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/vehicle")
@RequiredArgsConstructor
public class VehicleController {
    private final VehicleService vehicleService;

    @GetMapping("/{userId}")
    public ApiResponse<List<VehicleResponse>> getByUser(@PathVariable Long userId) {
        List<Vehicle> vehicles = vehicleService.getVehiclesByUserId(userId);
        List<VehicleResponse> data = vehicles.stream()
                .map(this::toDto)
                .toList();
        return new ApiResponse<>("200", "Vehicles found", data);
    }

    private static Double normalizeSoc(Double soc) {
        if (soc == null) return null;
        double s = soc;
        if (s < 0) s = 0;
        if (s <= 1.0) s *= 100.0;
        if (s > 100) s = 100;
        return Math.round(s * 10.0) / 10.0;
    }

    private VehicleResponse toDto(Vehicle v) {
        return VehicleResponse.builder()
                .id(v.getId())
                .make(v.getMake())
                .model(v.getModel())
                .currentSoc(normalizeSoc(v.getCurrentSoc()))
                .batteryCapacityKwh(v.getBatteryCapacityKwh())
                .acMaxKw(v.getAcMaxKw())
                .dcMaxKw(v.getDcMaxKw())
                .efficiency(v.getEfficiency())
                .build();
    }
}
