package com.pham.basis.evcharging.service;


import com.pham.basis.evcharging.dto.request.StationFilterRequest;
import com.pham.basis.evcharging.dto.request.StationRequest;

import com.pham.basis.evcharging.dto.response.ChargingStationDetailResponse;
import com.pham.basis.evcharging.dto.response.ChargingStationSummaryResponse;
import org.springframework.data.domain.Page;

public interface ChargingStationService {
    Page<ChargingStationSummaryResponse> getNearbyStations(StationFilterRequest request);
    ChargingStationDetailResponse getStationDetail(Long stationId, Double latitude, Double longitude);
    Double calculateDistance(Double lat1, Double lon1, Double lat2, Double lon2);
    ChargingStationDetailResponse addStation(String userName, StationRequest request);
}
