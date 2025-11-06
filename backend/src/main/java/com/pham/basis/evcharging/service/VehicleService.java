package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.request.VehicleRequest;
import com.pham.basis.evcharging.dto.response.VehicleResponse;
import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.model.Vehicle;

import java.util.List;

public interface VehicleService {
    List<Vehicle> getVehiclesByUserId(Long userId);
    VehicleResponse createVehicle(VehicleRequest vehicle, User user);
    void deleteVehicle(Long id, User user);
    VehicleResponse updateVehicle(Long id,VehicleRequest vehicle, User user);
}
