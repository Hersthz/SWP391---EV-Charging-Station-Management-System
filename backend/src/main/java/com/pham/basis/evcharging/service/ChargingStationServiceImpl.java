package com.pham.basis.evcharging.service;


import com.pham.basis.evcharging.dto.request.StationFilterRequest;
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
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class ChargingStationServiceImpl implements ChargingStationService {

    private final ChargingStationRepository stationRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ChargingStationResponse> findNearbyStations(StationFilterRequest request) {
        Double reqLat = request.getLatitude();
        Double reqLon = request.getLongitude();
        Double radius = request.getRadius() != null ? request.getRadius() : 5.0;

        if (reqLat == null || reqLon == null) return List.of();

        // Normalize requested connector types (upper-case) for case-insensitive compare
        Set<String> wantedConnectors = Optional.ofNullable(request.getConnectors())
                .orElse(Collections.emptyList())
                .stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .map(String::toUpperCase)
                .collect(Collectors.toSet());

        Double minPower = request.getMinPower();
        Double maxPower = request.getMaxPower();
        Double minPrice = request.getMinPrice();
        Double maxPrice = request.getMaxPrice();
        boolean filterPillarCriteria = !wantedConnectors.isEmpty() || minPower != null || maxPower != null || minPrice != null || maxPrice != null;

        List<ChargingStation> stations = stationRepository.findAll();

        // compute distance for each station (transient field) and filter by radius
        Stream<ChargingStation> stream = stations.stream()
                .peek(s -> {
                    Double d = calculateDistance(reqLat, reqLon, s.getLatitude(), s.getLongitude());
                    s.setDistance(d);
                })
                .filter(s -> s.getDistance() != null && s.getDistance() <= radius);

        // apply availableOnly (station-level)
        if (Boolean.TRUE.equals(request.getAvailableOnly())) {
            stream = stream.filter(this::hasAvailablePillar);
        }

        // apply pillar-level filters: connectors / power / price
        if (filterPillarCriteria) {
            stream = stream.filter(s -> stationHasPillarMatchingFilters(s, wantedConnectors, minPower, maxPower, minPrice, maxPrice));
        }

        // sorting
        Comparator<ChargingStation> comparator = Comparator.comparing(ChargingStation::getDistance, Comparator.nullsLast(Double::compareTo));
        String sort = request.getSort() != null ? request.getSort().trim().toLowerCase() : "distance";
        if ("price".equals(sort)) {
            // sort by cheapest price in station (ascending)
            comparator = Comparator.comparing(
                    s -> getCheapestPriceAcrossPillars(s),
                    Comparator.nullsLast(Double::compareTo)
            );
        } else if ("power".equals(sort)) {
            // sort by max power across pillars (descending)
            comparator = Comparator.comparing(
                    (ChargingStation s) -> getMaxPowerAcrossPillars(s),
                    Comparator.nullsLast(Double::compareTo)
            ).reversed();
        }

        List<ChargingStationResponse> results = stream
                .sorted(comparator)
                .map(this::convertToResponse)
                .collect(Collectors.toList());

        // pagination
        int page = request.getPage() != null ? request.getPage() : 0;
        int size = request.getSize() != null ? request.getSize() : 10;
        int start = page * size;
        if (start >= results.size()) return List.of();
        int end = Math.min(start + size, results.size());
        return results.subList(start, end);
    }

    /** Helper: station has at least one pillar that matches pillar-level criteria:
     *  - connector types (if wantedConnectors non-empty)
     *  - power within min/max (if provided)
     *  - price per kwh within min/max (if provided)
     */
    private boolean stationHasPillarMatchingFilters(ChargingStation station,
                                                    Set<String> wantedConnectors,
                                                    Double minPower, Double maxPower,
                                                    Double minPrice, Double maxPrice) {
        List<ChargerPillar> pillars = Optional.ofNullable(station.getPillars()).orElse(Collections.emptyList());
        for (ChargerPillar p : pillars) {
            if (p == null) continue;

            // power check
            if (minPower != null && (p.getPower() == null || p.getPower() < minPower)) continue;
            if (maxPower != null && (p.getPower() == null || p.getPower() > maxPower)) continue;

            // price check
            if (minPrice != null && (p.getPricePerKwh() == null || p.getPricePerKwh() < minPrice)) continue;
            if (maxPrice != null && (p.getPricePerKwh() == null || p.getPricePerKwh() > maxPrice)) continue;

            // connector check: if wantedConnectors empty -> accept
            if (wantedConnectors.isEmpty()) {
                return true; // this pillar satisfies power/price (connectors not required)
            }

            List<Connector> connectors = Optional.ofNullable(p.getConnectors()).orElse(Collections.emptyList());
            for (Connector c : connectors) {
                if (c == null || c.getType() == null) continue;
                String t = c.getType().trim().toUpperCase();
                if (wantedConnectors.contains(t)) {
                    return true;
                }
            }
            // this pillar didn't match connector requirement -> try next pillar
        }
        return false;
    }

    /** Helper: get cheapest price across station's pillars (nullable) */
    private Double getCheapestPriceAcrossPillars(ChargingStation s) {
        return Optional.ofNullable(s.getPillars()).orElse(Collections.emptyList()).stream()
                .map(ChargerPillar::getPricePerKwh)
                .filter(Objects::nonNull)
                .min(Double::compareTo)
                .orElse(null);
    }

    /** Helper: get max power across station's pillars (nullable) */
    private Double getMaxPowerAcrossPillars(ChargingStation s) {
        return Optional.ofNullable(s.getPillars()).orElse(Collections.emptyList()).stream()
                .map(ChargerPillar::getPower)
                .filter(Objects::nonNull)
                .max(Double::compareTo)
                .orElse(null);
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
                station.getDistance(),
                station.getStatus(),
                powerStr,
                availableStr,
                connectorTypes.isEmpty() ? null : connectorTypes,
                priceStr
        );
    }



}