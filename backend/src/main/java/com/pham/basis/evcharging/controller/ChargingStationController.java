package com.pham.basis.evcharging.controller;

import com.pham.basis.evcharging.dto.request.LocationRequest;
import com.pham.basis.evcharging.dto.response.ChargingStationResponse;
import com.pham.basis.evcharging.service.ChargingStationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/charging-stations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ChargingStationController {

    private final ChargingStationService stationService;

    @PostMapping("/nearby")
    public ResponseEntity<List<ChargingStationResponse>> getNearbyStations(
            @RequestBody LocationRequest request) {

        // Validate input
        if (request.getLatitude() == null || request.getLongitude() == null) {
            return ResponseEntity.badRequest().build();
        }

        List<ChargingStationResponse> stations = stationService.findNearbyStations(request);
        return ResponseEntity.ok(stations);
    }

}
