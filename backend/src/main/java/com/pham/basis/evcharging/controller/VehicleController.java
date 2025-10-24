package com.pham.basis.evcharging.controller;

import com.pham.basis.evcharging.dto.response.ApiResponse;
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

    @GetMapping("/user/{userId}")
    public ApiResponse<List<Vehicle>> getByUser(@PathVariable Long userId) {
        List<Vehicle> vehicles = vehicleService.getVehiclesByUserId(userId);
        return new ApiResponse<>("200", "Vehicles found", vehicles);
    }
}
