package com.pham.basis.evcharging.service;


import com.pham.basis.evcharging.dto.response.ChargingStationDetailResponse;
import com.pham.basis.evcharging.exception.AppException;
import com.pham.basis.evcharging.mapper.StationMapper;
import com.pham.basis.evcharging.model.ChargingStation;
import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.repository.ChargingStationRepository;
import com.pham.basis.evcharging.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class StationAssignmentService {
    private final UserRepository userRepository;
    private final ChargingStationRepository chargingStationRepository;
    private final StationMapper stationMapper;

    @Transactional
    public boolean assignManagerToStation(Long userId, Long stationId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        ChargingStation station = chargingStationRepository.findById(stationId)
                .orElseThrow(() -> new RuntimeException("Station not found"));


        if (user.getManagedStation() != null) {
            ChargingStation oldStation = user.getManagedStation();
            oldStation.setManager(null);
            chargingStationRepository.save(oldStation);
        }


        station.setManager(user);
        user.setManagedStation(station);

        chargingStationRepository.save(station);
        userRepository.save(user);

        return true;
    }

    @Transactional(readOnly = true)
    public ChargingStationDetailResponse getStationByManager(Long managerId) {

        ChargingStation station = chargingStationRepository.findByManagerId(managerId)
                .orElseThrow(() -> new AppException.NotFoundException("No station found for manager id: " + managerId));

        return stationMapper.toDetailResponse(station);
    }
}

