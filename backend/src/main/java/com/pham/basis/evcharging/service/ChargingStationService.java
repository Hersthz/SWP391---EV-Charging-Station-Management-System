package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.request.LocationRequest;
import com.pham.basis.evcharging.dto.response.ChargingStationResponse;
import com.pham.basis.evcharging.model.ChargingStation;

import java.util.List;

public interface ChargingStationService {
    public List<ChargingStationResponse> findNearbyStations(LocationRequest request);
    public ChargingStationResponse convertToResponse(ChargingStation station);
    public Double calculateDistance(Double lat1, Double lon1, Double lat2, Double lon2);
}
