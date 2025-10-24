package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.model.Vehicle;

import java.util.List;

public interface VehicleService {
    List<Vehicle> getVehiclesByUserId(Long userId);
}
