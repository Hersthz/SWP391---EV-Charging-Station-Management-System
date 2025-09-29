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
        List<ChargingStationResponse> stations = List.of(
                new ChargingStationResponse(1L, "Station A", "123 Street", 10.123, 106.456, 1.2),
                new ChargingStationResponse(2L, "Station B", "456 Avenue", 10.234, 106.567, 2.8),
                new ChargingStationResponse(3L, "Station C", "789 Boulevard", 10.345, 106.678, 5.5)
        );

//        List<ChargingStationResponse> stations = stationService.findNearbyStations(request);
        return ResponseEntity.ok(stations);
    }

}
