package com.pham.basis.evcharging.service;


import com.pham.basis.evcharging.dto.request.LocationRequest;
import com.pham.basis.evcharging.dto.response.ChargingStationResponse;
import com.pham.basis.evcharging.model.ChargerPillar;
import com.pham.basis.evcharging.model.ChargingStation;
import com.pham.basis.evcharging.model.Connector;
import com.pham.basis.evcharging.repository.ChargingStationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChargingStationServiceImpl implements ChargingStationService {

    private final ChargingStationRepository stationRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ChargingStationResponse> findNearbyStations(LocationRequest request) {
        Double reqLat = request.getLatitude();
        Double reqLon = request.getLongitude();
        Double radius = request.getRadius();

        if (reqLat == null || reqLon == null) {
            return List.of();
        }

        List<ChargingStation> stations = stationRepository.findAll();

        return stations.stream()
                .filter(s->hasAvailablePillar(s))
                .peek(s -> {
                    if (s.getDistance() == null
                            && s.getLatitude() != null
                            && s.getLongitude() != null) {
                        Double dist = calculateDistance(reqLat, reqLon, s.getLatitude(), s.getLongitude());
                        s.setDistance(dist);
                    }
                })
                .filter(s -> s.getDistance() != null && s.getDistance() <= radius)
                .sorted(Comparator.comparing(ChargingStation::getDistance))
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    //Kiểm tra có ít nhất 1 pillar available
    private boolean hasAvailablePillar(ChargingStation station) {
        List<ChargerPillar> pillars = Optional.ofNullable(station.getPillars()).orElse(Collections.emptyList());
        return pillars.stream().anyMatch(p->p.getStatus()!= null && p.getStatus().equalsIgnoreCase("Available"));
    }

    // Tính khoảng cách bằng Haversine (trả null nếu bất kỳ input nào null)
    public Double calculateDistance(Double lat1, Double lon1, Double lat2, Double lon2) {
        if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
            return null;
        }
        final int R = 6371; // km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double sinLat = Math.sin(latDistance / 2);
        double sinLon = Math.sin(lonDistance / 2);
        double a = sinLat * sinLat
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * sinLon * sinLon;
        double tmp = Math.min(1.0, Math.max(-1.0, Math.sqrt(a)));
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0.0, 1 - a)));

        return R * c;
    }


    public ChargingStationResponse convertToResponse(ChargingStation station) {
        // Guard null pillars
        List<ChargerPillar> pillars = Optional.ofNullable(station.getPillars()).orElse(Collections.emptyList());

        int totalPillars = pillars.size();
        int availablePillars = (int) pillars.stream()
                .filter(p -> p.getStatus() != null && p.getStatus().equalsIgnoreCase("Available"))
                .count();

        // connectors: distinct types across all pillars
        List<String> connectorTypes = pillars.stream()
                .flatMap(p -> Optional.ofNullable(p.getConnectors()).orElse(Collections.emptyList()).stream())
                .map(Connector::getType)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        // cheapest price across pillars (nullable)
        Double cheapest = pillars.stream()
                .map(ChargerPillar::getPricePerKwh)
                .filter(Objects::nonNull)
                .min(Double::compareTo)
                .orElse(null);

        // max power across pillars (nullable)
        Double maxPower = pillars.stream()
                .map(ChargerPillar::getPower)
                .filter(Objects::nonNull)
                .max(Double::compareTo)
                .orElse(null);

        // Format fields to match frontend expectations (strings)
        String powerStr = (maxPower != null) ? String.format("%.0f kW", maxPower) : null;
        String availableStr = totalPillars > 0 ? String.format("%d/%d available", availablePillars, totalPillars) : null;
        String priceStr = (cheapest != null) ? String.format("%.2f /kWh", cheapest) : null;

        return new ChargingStationResponse(
                station.getId(),
                station.getName(),
                station.getAddress(),
                station.getLatitude(),
                station.getLongitude(),
                station.getDistance(), // giữ nguyên nếu DB đã tính
                station.getStatus(),
                powerStr,
                availableStr,
                connectorTypes.isEmpty() ? null : connectorTypes,
                priceStr
        );
    }



}