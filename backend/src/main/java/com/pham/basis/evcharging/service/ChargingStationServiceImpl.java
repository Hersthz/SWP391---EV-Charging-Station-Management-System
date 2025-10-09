package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.controller.AddStationRequest;
import com.pham.basis.evcharging.dto.request.StationFilterRequest;
import com.pham.basis.evcharging.dto.response.AddStationResponse;
import com.pham.basis.evcharging.dto.response.ChargingStationDetailResponse;
import com.pham.basis.evcharging.dto.response.ChargingStationSummaryResponse;
import com.pham.basis.evcharging.mapper.StationMapper;
import com.pham.basis.evcharging.model.ChargingStation;
import com.pham.basis.evcharging.repository.ChargingStationRepository;
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
    public AddStationResponse addStation(String userName, AddStationRequest request) {
        // TODO: Implement when add station feature is ready
        return null;
    }
}
