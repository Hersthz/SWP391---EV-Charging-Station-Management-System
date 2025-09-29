package com.pham.basis.evcharging.service;


import com.pham.basis.evcharging.dto.request.LocationRequest;
import com.pham.basis.evcharging.dto.response.ChargingStationResponse;
import com.pham.basis.evcharging.model.ChargingStation;
import com.pham.basis.evcharging.repository.ChargingStationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChargingStationService implements IChargingStationService {

    private final ChargingStationRepository stationRepository;

    public List<ChargingStationResponse> findNearbyStations(LocationRequest request) {
        List<ChargingStation> stations = stationRepository.findNearbyStations(
                request.getLatitude(),
                request.getLongitude(),
                request.getRadius()
        );

        return stations.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public ChargingStationResponse convertToResponse(ChargingStation station) {
        return new ChargingStationResponse(
                station.getStationId(),
                station.getName(),
                station.getAddress(),
                station.getLatitude(),
                station.getLongitude(),
                station.getDistance()
        );
    }

    // Tính khoảng cách bằng Haversine formula
    public Double calculateDistance(Double lat1, Double lon1, Double lat2, Double lon2) {
        final int R = 6371; // Bán kính trái đất (km)

        Double latDistance = Math.toRadians(lat2 - lat1);
        Double lonDistance = Math.toRadians(lon2 - lon1);

        Double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);

        Double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }
}