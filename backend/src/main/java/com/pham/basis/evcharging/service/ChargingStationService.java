package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.controller.AddStationRequest;
import com.pham.basis.evcharging.dto.request.GetStationRequest;
import com.pham.basis.evcharging.dto.request.StationFilterRequest;
import com.pham.basis.evcharging.dto.response.AddStationResponse;
import com.pham.basis.evcharging.dto.response.ChargingStationDetailResponse;
import com.pham.basis.evcharging.dto.response.ChargingStationSummaryResponse;
import com.pham.basis.evcharging.model.ChargingStation;

import java.util.List;

public interface ChargingStationService {
    public List<ChargingStationSummaryResponse> getNearbyStations(StationFilterRequest request);
    public ChargingStationDetailResponse getStationDetail(GetStationRequest request);
    public Double calculateDistance(Double lat1, Double lon1, Double lat2, Double lon2);
    AddStationResponse addStation(String userName, AddStationRequest request);
}
