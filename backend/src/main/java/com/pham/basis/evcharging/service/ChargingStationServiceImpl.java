package com.pham.basis.evcharging.service;


import com.pham.basis.evcharging.dto.request.StationFilterRequest;
import com.pham.basis.evcharging.dto.request.StationRequest;

import com.pham.basis.evcharging.dto.response.ChargingStationDetailResponse;
import com.pham.basis.evcharging.dto.response.ChargingStationSummaryResponse;
import com.pham.basis.evcharging.mapper.StationMapper;
import com.pham.basis.evcharging.model.ChargerPillar;
import com.pham.basis.evcharging.model.ChargingStation;
import com.pham.basis.evcharging.model.Connector;
import com.pham.basis.evcharging.repository.ChargingStationRepository;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChargingStationServiceImpl implements ChargingStationService {

    private final ChargingStationRepository stationRepository;
    private final StationMapper stationMapper;


    @Override
    @Transactional(readOnly = true)
    public Page<ChargingStationSummaryResponse> getNearbyStations(StationFilterRequest request) {

        List<String> connectors = request.getConnectors();
        if (connectors != null && connectors.isEmpty()) {
            connectors = null;
        }

        Integer availableOnlyParam = null;
        if (request.getAvailableOnly() != null) {
            availableOnlyParam = request.getAvailableOnly() ? 1 : 0;
        }

        Pageable pageable = PageRequest.of(request.getPage(), request.getSize());

        Page<ChargingStation> page = stationRepository.findNearbyStations(
                request.getLatitude(),
                request.getLongitude(),
                request.getRadius(),
                connectors,
                request.getMinPower(),
                request.getMaxPower(),
                request.getMinPrice(),
                request.getMaxPrice(),
                availableOnlyParam,
                request.getSearch(),
                pageable
        );

        if (request.getLatitude() != null && request.getLongitude() != null) {
            double lat = request.getLatitude();
            double lon = request.getLongitude();
            page.getContent().forEach(station ->
                    station.setDistance(calculateDistance(lat, lon, station.getLatitude(), station.getLongitude()))
            );
        }

        return page.map(stationMapper::toSummaryResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ChargingStationDetailResponse getStationDetail(Long stationId, Double latitude, Double longitude) {

        ChargingStation station = stationRepository.findById(stationId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Station not found with id: " + stationId
                ));

        Double distance = (latitude != null && longitude != null)
                ? calculateDistance(latitude, longitude, station.getLatitude(), station.getLongitude())
                : null;

        station.setDistance(distance);
        return stationMapper.toDetailResponse(station, distance);
    }

    public Double calculateDistance(Double lat1, Double lon1, Double lat2, Double lon2) {
        if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;

        final int R = 6371;
        double latDist = Math.toRadians(lat2 - lat1);
        double lonDist = Math.toRadians(lon2 - lon1);

        double a = Math.sin(latDist / 2) * Math.sin(latDist / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDist / 2) * Math.sin(lonDist / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c * 100.0) / 100.0;
    }



    @Override
    public ChargingStationDetailResponse addStation( StationRequest request) {
        // Validate request
        validateAddStationRequest(request);

        // Create station entity
        ChargingStation station = new ChargingStation();
        station.setName(request.getStationName());
        station.setAddress(request.getAddress());
        station.setLatitude(request.getLatitude());
        station.setLongitude(request.getLongitude());
        station.setStatus("Available");

        // Add pillars and connectors (if provided)
        if (request.getPillars() != null && !request.getPillars().isEmpty()) {
            for (StationRequest.PillarRequest pillarReq : request.getPillars()) {
                ChargerPillar pillar = new ChargerPillar();
                pillar.setCode(pillarReq.getCode());
                pillar.setPower(pillarReq.getPower());
                pillar.setPricePerKwh(pillarReq.getPricePerKwh());
                pillar.setStatus("Available");

                // Add connectors to pillar
                if (pillarReq.getConnectors() != null && !pillarReq.getConnectors().isEmpty()) {
                    for (StationRequest.ConnectorRequest connReq : pillarReq.getConnectors()) {
                        Connector connector = new Connector();
                        connector.setType(connReq.getConnectorType());
                        pillar.addConnector(connector);
                    }
                }

                station.addPillar(pillar);
            }
        }

        // Save station (cascade will save pillars and connectors)
        ChargingStation savedStation = stationRepository.save(station);

        // Convert to DTO using mapper (without distance parameter)
        return stationMapper.toDetailResponse(savedStation);
    }

    private void validateAddStationRequest(StationRequest request) {
        if (request.getStationName() == null || request.getStationName().trim().isEmpty()) {
            throw new ValidationException("Station name is required");
        }
        if (request.getAddress() == null || request.getAddress().trim().isEmpty()) {
            throw new ValidationException("Address is required");
        }
        if (request.getLatitude() < -90 || request.getLatitude() > 90) {
            throw new ValidationException("Invalid latitude value");
        }
        if (request.getLongitude() < -180 || request.getLongitude() > 180) {
            throw new ValidationException("Invalid longitude value");
        }
    }
}
