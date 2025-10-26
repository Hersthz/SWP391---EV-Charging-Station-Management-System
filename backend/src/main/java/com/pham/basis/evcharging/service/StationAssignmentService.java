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
        Optional<User> userOpt = userRepository.findById(userId);
        Optional<ChargingStation> stationOpt = chargingStationRepository.findById(stationId);

        if (userOpt.isEmpty() || stationOpt.isEmpty()) {
            return false;
        }

        User user = userOpt.get();
        ChargingStation station = stationOpt.get();

        station.setManager(user);
        user.setManagedStation(station);

        chargingStationRepository.save(station);
        return true;
    }

    @Transactional(readOnly = true)
    public ChargingStationDetailResponse getStationByManager(Long managerId) {

        ChargingStation station = chargingStationRepository.findByManagerId(managerId)
                .orElseThrow(() -> new AppException.NotFoundException("No station found for manager id: " + managerId));

        return stationMapper.toDetailResponse(station);
    }
}

