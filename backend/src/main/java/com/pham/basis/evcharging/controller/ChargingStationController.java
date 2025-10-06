package com.pham.basis.evcharging.controller;

import com.pham.basis.evcharging.dto.request.GetStationRequest;
import com.pham.basis.evcharging.dto.request.StationFilterRequest;
import com.pham.basis.evcharging.dto.response.ChargingStationDetailResponse;
import com.pham.basis.evcharging.dto.response.ChargingStationSummaryResponse;
import com.pham.basis.evcharging.service.ChargingStationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/charging-stations")
@RequiredArgsConstructor
@CrossOrigin
public class ChargingStationController {

    private final ChargingStationService stationService;

    @PostMapping("/nearby")
    public ResponseEntity<List<ChargingStationSummaryResponse>> getNearbyStations(
            @RequestBody StationFilterRequest request) {

        if (request.getLatitude() == null || request.getLongitude() == null) {
            return ResponseEntity.badRequest().build();
        }
        List<ChargingStationSummaryResponse> stations = stationService.getNearbyStations(request);
        return ResponseEntity.ok(stations);
    }

    @PostMapping("/detail")
    public ResponseEntity<ChargingStationDetailResponse> getStations(@RequestBody GetStationRequest request) {
        if (request.getStationId() == null) {
            return ResponseEntity.badRequest().build();
        }
        ChargingStationDetailResponse stationDetailResponse = stationService.getStationDetail(request);
        return ResponseEntity.ok(stationDetailResponse);
    }
}