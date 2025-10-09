package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.controller.AddStationRequest;
import com.pham.basis.evcharging.dto.request.StationFilterRequest;
import com.pham.basis.evcharging.dto.response.AddStationResponse;
import com.pham.basis.evcharging.dto.response.ChargingStationDetailResponse;
import com.pham.basis.evcharging.dto.response.ChargingStationSummaryResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface ChargingStationService {
    Page<ChargingStationSummaryResponse> getNearbyStations(StationFilterRequest request);
    ChargingStationDetailResponse getStationDetail(Long stationId, Double latitude, Double longitude);
    Double calculateDistance(Double lat1, Double lon1, Double lat2, Double lon2);
    AddStationResponse addStation(String userName, AddStationRequest request);
}
