package com.pham.basis.evcharging.service.Impl;


import com.pham.basis.evcharging.dto.request.StationFilterRequest;
import com.pham.basis.evcharging.dto.request.StationRequest;

import com.pham.basis.evcharging.dto.response.ChargingStationDetailResponse;
import com.pham.basis.evcharging.dto.response.ChargingStationSummaryResponse;
import com.pham.basis.evcharging.mapper.StationMapper;
import com.pham.basis.evcharging.model.ChargerPillar;
import com.pham.basis.evcharging.model.ChargingStation;
import com.pham.basis.evcharging.model.Connector;
import com.pham.basis.evcharging.repository.ChargingStationRepository;
import com.pham.basis.evcharging.service.ChargingStationService;
import com.pham.basis.evcharging.service.CloudinaryService;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChargingStationServiceImpl implements ChargingStationService {

    private final ChargingStationRepository stationRepository;
    private final StationMapper stationMapper;
    private final CloudinaryService cloudinaryService;


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

        Page<ChargingStation> page = filterStations(
                request.getLatitude(),
                request.getLongitude(),
                request.getRadius(),
                request.getSearch(),
                connectors,
                request.getMinPower(),
                request.getMaxPower(),
                request.getMinPrice(),
                request.getMaxPrice(),
                request.getAvailableOnly(),
                pageable
        );

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

    @Override
    public ChargingStationDetailResponse addStation(StationRequest request, MultipartFile file) {
        // Validate request
        validateAddStationRequest(request);

        // Create station entity
        ChargingStation station = new ChargingStation();
        station.setName(request.getStationName());
        station.setAddress(request.getAddress());
        station.setLatitude(request.getLatitude());
        station.setLongitude(request.getLongitude());
        station.setStatus("AVAILABLE");
        if (file != null && !file.isEmpty()) {
            String url = cloudinaryService.uploadFile(file, "stations");
            station.setUrl(url);
        }

        // Add pillars and connectors (if provided)
        if (request.getPillars() != null && !request.getPillars().isEmpty()) {
            for (StationRequest.PillarRequest pillarReq : request.getPillars()) {
                ChargerPillar pillar = new ChargerPillar();
                pillar.setCode(pillarReq.getCode());
                pillar.setPower(pillarReq.getPower());
                pillar.setPricePerKwh(pillarReq.getPricePerKwh());

                // Add connectors to pillar
                if (pillarReq.getConnectors() != null && !pillarReq.getConnectors().isEmpty()) {
                    for (StationRequest.ConnectorRequest connReq : pillarReq.getConnectors()) {
                        Connector connector = new Connector();
                        connector.setType(connReq.getConnectorType());
                        connector.setStatus("AVAILABLE");
                        connector.setPillar(pillar);
                        pillar.addConnector(connector);
                    }
                }

                pillar.setStation(station);
                station.addPillar(pillar);
            }
        }

        // Save station (cascade will save pillars and connectors)
        ChargingStation savedStation = stationRepository.save(station);

        // Convert to DTO using mapper (without distance parameter)
        return stationMapper.toDetailResponse(savedStation);
    }

    @Override
    public ChargingStationDetailResponse addPillarsWithConnectors(Long stationId, List<StationRequest.PillarRequest> pillarRequests) {
        if (stationId == null) {
            throw new ValidationException("stationId is required");
        }
        if (pillarRequests == null || pillarRequests.isEmpty()) {
            throw new ValidationException("At least one pillar is required");
        }

        ChargingStation station = stationRepository.findById(stationId)
                .orElseThrow(() -> new RuntimeException("Station not found with id: " + stationId));

        for (StationRequest.PillarRequest pillarReq : pillarRequests) {
            validatePillarRequest(pillarReq);

            ChargerPillar pillar = new ChargerPillar();
            pillar.setCode(pillarReq.getCode());
            pillar.setPower(pillarReq.getPower());
            pillar.setPricePerKwh(pillarReq.getPricePerKwh());

            // Add connectors (1–2 connectors per your preference)
            if (pillarReq.getConnectors() != null && !pillarReq.getConnectors().isEmpty()) {
                if (pillarReq.getConnectors().size() > 2) {
                    throw new ValidationException("Each pillar can have at most 2 connectors");
                }
                for (StationRequest.ConnectorRequest connReq : pillarReq.getConnectors()) {
                    validateConnectorRequest(connReq);

                    Connector connector = new Connector();
                    connector.setType(connReq.getConnectorType());
                    connector.setStatus("AVAILABLE");

                    connector.setPillar(pillar);
                    pillar.addConnector(connector);
                }
            } else {
                // optional: enforce at least 1 connector
                throw new ValidationException("Each pillar must have at least 1 connector");
            }

            // link pillar to station
            pillar.setStation(station);
            station.addPillar(pillar);
        }

        ChargingStation saved = stationRepository.save(station);
        return stationMapper.toDetailResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ChargingStationDetailResponse> getAllStation(Integer size, Integer page) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ChargingStation> stations = stationRepository.findAll(pageable);
        return stations.map(stationMapper::toDetailResponse);
    }

    //-------------helper-------
    private void validatePillarRequest(StationRequest.PillarRequest pillarReq) {
        if (pillarReq.getCode() == null || pillarReq.getCode().trim().isEmpty()) {
            throw new ValidationException("Pillar code is required");
        }
        if (pillarReq.getPower() == null || pillarReq.getPower().doubleValue() <= 0) {
            throw new ValidationException("Pillar power must be positive");
        }
        if (pillarReq.getPricePerKwh() == null || pillarReq.getPricePerKwh().doubleValue() < 0) {
            throw new ValidationException("Price per kWh cannot be negative");
        }
    }

    private void validateConnectorRequest(StationRequest.ConnectorRequest connReq) {
        if (connReq.getConnectorType() == null || connReq.getConnectorType().trim().isEmpty()) {
            throw new ValidationException("Connector type is required");
        }
    }

    private void validateAddStationRequest(StationRequest request) {
        if (request.getStationName() == null || request.getStationName().trim().isEmpty()) {
            throw new ValidationException("Station name is required");
        }
        if (request.getAddress() == null || request.getAddress().trim().isEmpty()) {
            throw new ValidationException("Address is required");
        }
        if ( request.getLatitude() < -90 || request.getLatitude() > 90) {
            throw new ValidationException("Invalid latitude value");
        }
        if ( request.getLongitude() < -180 || request.getLongitude() > 180) {
            throw new ValidationException("Invalid longitude value");
        }
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

    //
    public Page<ChargingStation> filterStations(
            Double latitude, Double longitude, Double radiusKm,
            String search,
            List<String> connectors,
            Double minPower, Double maxPower,
            Double minPrice, Double maxPrice,
            Boolean availableOnly,
            Pageable pageable
    ) {
        List<ChargingStation> all = stationRepository.findAll();
        Stream<ChargingStation> stream = all.stream();

        // search name/address
        if (search != null && !search.isBlank()) {
            String keyword = search.toLowerCase(Locale.ROOT);
            stream = stream.filter(s ->
                    (s.getName() != null && s.getName().toLowerCase(Locale.ROOT).contains(keyword))
                            || (s.getAddress() != null && s.getAddress().toLowerCase(Locale.ROOT).contains(keyword))
            );
        }

        // power
        if (minPower != null) stream = stream.filter(s ->
                s.getPillars().stream().anyMatch(p -> p.getPower() != null && p.getPower() >= minPower)
        );
        if (maxPower != null) stream = stream.filter(s ->
                s.getPillars().stream().anyMatch(p -> p.getPower() != null && p.getPower() <= maxPower)
        );

        // price
        if (minPrice != null) stream = stream.filter(s ->
                s.getPillars().stream().anyMatch(p -> p.getPricePerKwh() != null && p.getPricePerKwh() >= minPrice)
        );
        if (maxPrice != null) stream = stream.filter(s ->
                s.getPillars().stream().anyMatch(p -> p.getPricePerKwh() != null && p.getPricePerKwh() <= maxPrice)
        );

        // connectors
        if (connectors != null && !connectors.isEmpty()) {
            List<String> connectorList = connectors.stream()
                    .filter(Objects::nonNull)
                    .map(String::toLowerCase)
                    .toList();

            stream = stream.filter(s ->
                    s.getPillars().stream()
                            .flatMap(p -> Optional.ofNullable(p.getConnectors()).orElse(List.of()).stream())
                            .anyMatch(c -> c.getType() != null && connectorList.contains(c.getType().toLowerCase()))
            );
        }

        // availableOnly
        if (availableOnly != null && availableOnly) {
            stream = stream.filter(s ->
                    s.getPillars().stream()
                            .flatMap(p -> Optional.ofNullable(p.getConnectors()).orElse(List.of()).stream())
                            .anyMatch(c -> c.getStatus() != null && "AVAILABLE".equalsIgnoreCase(c.getStatus()))
            );
        }

        // compute distance and filter by radius
        List<ChargingStation> filtered = stream.collect(Collectors.toList());

        if (latitude != null && longitude != null) {
            for (ChargingStation s : filtered) {
                Double dist = calculateDistance(latitude, longitude, s.getLatitude(), s.getLongitude());
                s.setDistance(dist);
            }

            if (radiusKm != null) {
                filtered = filtered.stream()
                        .filter(s -> s.getDistance() != null && s.getDistance() <= radiusKm)
                        .collect(Collectors.toList());
            }

            // sort by distance asc
            filtered.sort(Comparator.comparing(ChargingStation::getDistance, Comparator.nullsLast(Double::compareTo)));
        }

        // pagination
        int total = filtered.size();
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), total);
        List<ChargingStation> pageContent = start <= end ? filtered.subList(start, end) : Collections.emptyList();

        return new PageImpl<>(pageContent, pageable, total);
    }
}

