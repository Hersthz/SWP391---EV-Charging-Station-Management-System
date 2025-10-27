package com.pham.basis.evcharging.controller;

import com.pham.basis.evcharging.dto.request.StationFilterRequest;
import com.pham.basis.evcharging.dto.request.StationRequest;
import com.pham.basis.evcharging.dto.response.ChargingStationDetailResponse;
import com.pham.basis.evcharging.dto.response.ChargingStationResponse;
import com.pham.basis.evcharging.dto.response.ChargingStationSummaryResponse;
import com.pham.basis.evcharging.service.ChargingStationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@Validated
@RestController
@RequestMapping("/charging-stations")
@RequiredArgsConstructor
public class ChargingStationController {

    private final ChargingStationService stationService;
    private final ChargingStationService chargingStationService;

    @GetMapping("/nearby")
    public ResponseEntity<Page<ChargingStationSummaryResponse>> getNearbyStations(
           @Valid @ModelAttribute StationFilterRequest request) {

        log.info("Searching nearby stations with filters: {}", request);

        Page<ChargingStationSummaryResponse> stations = stationService.getNearbyStations(request);
        return ResponseEntity.ok(stations);
    }

    @GetMapping("/{stationId}")
    public ResponseEntity<ChargingStationDetailResponse> getStationDetail(
            @PathVariable @NotNull Long stationId,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude) {

        log.info("Getting station detail for ID: {}", stationId);
        ChargingStationDetailResponse response = stationService.getStationDetail(stationId, latitude, longitude);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/addStation")
    public ResponseEntity<ChargingStationDetailResponse> addStation(
            @Valid @RequestBody StationRequest request) {
        log.info("Adding station");
        return ResponseEntity.ok(stationService.addStation(request));
    }
    @PostMapping("/{stationId}/pillars")
    public ResponseEntity<ChargingStationDetailResponse> addPillars(
            @PathVariable Long stationId,
            @Valid @RequestBody List<StationRequest.PillarRequest> pillars) {

        var resp = chargingStationService.addPillarsWithConnectors(stationId, pillars);
        return ResponseEntity.ok(resp);
    }





}