package com.pham.basis.evcharging.service;


import com.pham.basis.evcharging.dto.request.StationFilterRequest;
import com.pham.basis.evcharging.dto.request.StationRequest;

import com.pham.basis.evcharging.dto.response.ChargingStationDetailResponse;
import com.pham.basis.evcharging.dto.response.ChargingStationSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ChargingStationService {
    ChargingStationDetailResponse getStationDetail(Long stationId, Double latitude, Double longitude);
    Page<ChargingStationSummaryResponse> getNearbyStations(StationFilterRequest request);
    Double calculateDistance(Double lat1, Double lon1, Double lat2, Double lon2);
    ChargingStationDetailResponse addStation(StationRequest request, MultipartFile file);
    ChargingStationDetailResponse addPillarsWithConnectors(Long stationId, List<StationRequest.PillarRequest> pillarRequests);

    Page<ChargingStationDetailResponse> getAllStation(Integer size, Integer page);

}
