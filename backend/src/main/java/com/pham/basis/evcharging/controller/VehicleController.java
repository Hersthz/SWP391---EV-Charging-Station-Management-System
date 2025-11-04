package com.pham.basis.evcharging.controller;

import com.pham.basis.evcharging.dto.request.VehicleRequest;
import com.pham.basis.evcharging.dto.response.ApiResponse;
import com.pham.basis.evcharging.dto.response.VehicleResponse;
import com.pham.basis.evcharging.exception.AppException;
import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.model.Vehicle;
import com.pham.basis.evcharging.service.UserService;
import com.pham.basis.evcharging.service.VehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/vehicle")
@RequiredArgsConstructor
public class VehicleController {
    private final VehicleService vehicleService;
    private final UserService userService;

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

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<VehicleResponse>> createVehicle(@Valid @RequestBody VehicleRequest vehicleRequest, Principal principal) {
        if (principal == null) {
            throw new AppException.NotFoundException("User not found for this token");
        }
        User user = userService.findByUsername(principal.getName());
        VehicleResponse vehicle = vehicleService.createVehicle(vehicleRequest, user);
        return new ResponseEntity<>(new ApiResponse<>("200", "Vehicle created", vehicle), HttpStatus.OK);
    }

    @PostMapping("/delete/{id}")
    public ResponseEntity<ApiResponse<VehicleResponse>> deleteVehicle(@PathVariable Long id, Principal principal) {
        if (principal == null) {
            throw new AppException.NotFoundException("User not found for this token");
        }
        User user = userService.findByUsername(principal.getName());

        vehicleService.deleteVehicle(id, user);
        return new ResponseEntity<>(new ApiResponse<>("200", "Vehicle created", null), HttpStatus.OK);
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<ApiResponse<VehicleResponse>> updateVehicle(@PathVariable Long id,@Valid @RequestBody VehicleRequest vehicleRequest, Principal principal) {
        if (principal == null) {
            throw new AppException.NotFoundException("User not found for this token");
        }
        User user = userService.findByUsername(principal.getName());

        VehicleResponse vehicle = vehicleService.updateVehicle(id, vehicleRequest, user);
        return new ResponseEntity<>(new ApiResponse<>("200", "Vehicle updated", vehicle), HttpStatus.OK);
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
