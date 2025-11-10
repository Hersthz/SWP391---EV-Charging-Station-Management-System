package com.pham.basis.evcharging.service.Impl;

import com.pham.basis.evcharging.dto.request.VehicleRequest;
import com.pham.basis.evcharging.dto.response.VehicleResponse;
import com.pham.basis.evcharging.exception.AppException;
import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.model.Vehicle;
import com.pham.basis.evcharging.repository.VehicleRepository;
import com.pham.basis.evcharging.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VehicleServiceImpl implements VehicleService {

    private final VehicleRepository vehicleRepository;

    @Transactional(readOnly = true)
    public List<Vehicle> getVehiclesByUserId(Long userId) {
        return vehicleRepository.findByUserIdAndActiveTrue(userId);
    }

    @Override
    public VehicleResponse createVehicle(VehicleRequest req, User user) {
        double socRatio = req.getCurrentSoc() / 100.0;

        Vehicle vehicle = Vehicle.builder()
                .make(req.getMake())
                .model(req.getModel())
                .currentSoc(socRatio)
                .batteryCapacityKwh(req.getBatteryCapacityKwh())
                .acMaxKw(req.getAcMaxKw() != null ? req.getAcMaxKw() : 7.4)
                .dcMaxKw(req.getDcMaxKw() != null ? req.getDcMaxKw() : 50.0)
                .efficiency(0.9)
                .active(true)
                .user(user)
                .build();
        vehicleRepository.save(vehicle);
        return VehicleResponse.builder()
                .id(vehicle.getId())
                .efficiency(vehicle.getEfficiency())
                .dcMaxKw(vehicle.getDcMaxKw())
                .acMaxKw(vehicle.getAcMaxKw())
                .batteryCapacityKwh(vehicle.getBatteryCapacityKwh())
                .currentSoc(vehicle.getCurrentSoc())
                .model(vehicle.getModel())
                .make(vehicle.getMake())
                .build();
    }

    @Override
    public void deleteVehicle(Long id, User user) {
        Vehicle v = vehicleRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new AppException.NotFoundException("Vehicle not found"));
        v.setActive(false);
        vehicleRepository.save(v);
    }

    @Override
    public VehicleResponse updateVehicle(Long id,VehicleRequest req, User user) {
        Vehicle vehicle = vehicleRepository.findByIdAndUserUsername(id, user.getUsername())
                .orElseThrow(() -> new AppException.ForbiddenException("You do not own this vehicle"));

        Double socNormalized = req.getCurrentSoc() / 100.0;
        if (socNormalized < 0 || socNormalized > 1) {
            throw new AppException.BadRequestException("SOC must be between 0 and 100%");
        }

        vehicle.setMake(req.getMake());
        vehicle.setModel(req.getModel());
        vehicle.setCurrentSoc(socNormalized);
        vehicle.setBatteryCapacityKwh(req.getBatteryCapacityKwh());
        vehicle.setAcMaxKw(req.getAcMaxKw());
        vehicle.setDcMaxKw(req.getDcMaxKw());

        vehicleRepository.save(vehicle);

        return VehicleResponse.builder()
                .id(vehicle.getId())
                .make(vehicle.getMake())
                .model(vehicle.getModel())
                .currentSoc(vehicle.getCurrentSoc())
                .batteryCapacityKwh(vehicle.getBatteryCapacityKwh())
                .acMaxKw(vehicle.getAcMaxKw())
                .dcMaxKw(vehicle.getDcMaxKw())
                .build();
    }

}
