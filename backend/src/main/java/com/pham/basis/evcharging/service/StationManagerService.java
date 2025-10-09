package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.model.ChargingStation;
import com.pham.basis.evcharging.model.StationManager;
import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.repository.ChargingStationRepository;
import com.pham.basis.evcharging.repository.StationManagerRepository;
import com.pham.basis.evcharging.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StationManagerService {
    private final StationManagerRepository repository;
    private final UserRepository userRepository;
    private final ChargingStationRepository chargingStationRepository;
    public StationManager assignManagerToStation(Long userId, Long stationId){
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        ChargingStation chargingStation = chargingStationRepository.findById(stationId).orElseThrow(() -> new RuntimeException("Station not found with id: " + stationId));

        if (repository.existsByManagerIdAndStationId(userId, stationId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User already manages this station");
        }
        StationManager stationManager = new StationManager();
        stationManager.setStation(chargingStation);
        stationManager.setManager(user);

        return repository.save(stationManager);
    }

    public List<StationManager> getStationsManagedByUser(Long userId) {
        return repository.findByManagerId(userId);
    }

}
