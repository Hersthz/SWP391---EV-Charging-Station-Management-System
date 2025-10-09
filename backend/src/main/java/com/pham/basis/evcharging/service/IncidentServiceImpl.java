package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.request.IncidentRequest;
import com.pham.basis.evcharging.model.ChargerPillar;
import com.pham.basis.evcharging.model.ChargingStation;
import com.pham.basis.evcharging.model.Incident;
import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.repository.ChargerPillarRepository;
import com.pham.basis.evcharging.repository.ChargingStationRepository;
import com.pham.basis.evcharging.repository.IncidentRepository;
import com.pham.basis.evcharging.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class IncidentServiceImpl implements  IncidentService {
    private final IncidentRepository repository;
    private final ChargingStationRepository chargingStationRepository;
    private final ChargerPillarRepository chargerPillarRepository;
    private final UserRepository userRepository;

    @Override
    public void createIncident(IncidentRequest request) {
        ChargingStation station = chargingStationRepository.findById(request.getStationId())
                .orElseThrow(() -> new RuntimeException("Station not found with id: " + request.getStationId()));

        ChargerPillar pillar = chargerPillarRepository.findById(request.getPillarId())
                .orElseThrow(() -> new RuntimeException("Pillar not found with id: " + request.getPillarId()));

        User reporter = userRepository.findById(request.getReportedById())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + request.getReportedById()));
        Incident incident = Incident.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(request.getPriority())
                .status("Open")
                .station(station)
                .pillar(pillar)
                .reportedBy(reporter)
                .reportedTime(LocalDateTime.now())
                .build();
        repository.save(incident);
    }
}
