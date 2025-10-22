package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.model.Vehicle;
import org.springframework.stereotype.Service;

import java.util.List;
@Service
public class VehicleServiceImpl implements  VehicleService {
    @Override
    public List<Vehicle> getVehiclesByUserId(long userId) {
        return getVehiclesByUserId(userId);
    }
}
