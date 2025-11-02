package com.pham.basis.evcharging.service.Impl;

import com.pham.basis.evcharging.dto.request.IncidentRequest;
import com.pham.basis.evcharging.dto.response.IncidentResponse;
import com.pham.basis.evcharging.exception.AppException;
import com.pham.basis.evcharging.model.ChargerPillar;
import com.pham.basis.evcharging.model.ChargingStation;
import com.pham.basis.evcharging.model.Incident;
import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.repository.ChargerPillarRepository;
import com.pham.basis.evcharging.repository.ChargingStationRepository;
import com.pham.basis.evcharging.repository.IncidentRepository;
import com.pham.basis.evcharging.repository.UserRepository;
import com.pham.basis.evcharging.service.IncidentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class IncidentServiceImpl implements IncidentService {
    private final IncidentRepository repository;
    private final ChargingStationRepository chargingStationRepository;
    private final ChargerPillarRepository chargerPillarRepository;
    private final UserRepository userRepository;

    @Override
    public void createIncident(IncidentRequest request) {
        //load
        ChargingStation station = chargingStationRepository.findById(request.getStationId())
                .orElseThrow(() -> new AppException.NotFoundException("Station not found with id: " + request.getStationId()));

        ChargerPillar pillar = chargerPillarRepository.findById(request.getPillarId())
                .orElseThrow(() -> new AppException.NotFoundException("Pillar not found with id: " + request.getPillarId()));

        User reporter = userRepository.findById(request.getReportedById())
                .orElseThrow(() -> new AppException.NotFoundException("User not found with id: " + request.getReportedById()));
        //
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

    @Override
    public List<IncidentResponse> getAllIncident() {
        List<Incident> incidents = repository.findAll(Sort.by(Sort.Direction.DESC,"reportedTime"));
        return incidents.stream().map(
                incident -> IncidentResponse.builder()
                        .id(incident.getId())
                        .title(incident.getTitle())
                        .stationId(incident.getStation().getId())
                        .stationName(incident.getStation().getName())
                        .pillarId(incident.getPillar().getId())
                        .priority(incident.getPriority())
                        .status(incident.getStatus())
                        .description(incident.getDescription())
                        .reportedBy(incident.getReportedBy().getFullName())
                        .reportedById(incident.getReportedBy().getId())
                        .reportedTime(incident.getReportedTime())
                        .build()
        ).toList();
    }


}
