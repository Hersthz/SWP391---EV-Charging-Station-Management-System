package com.pham.basis.evcharging.controller;

import com.pham.basis.evcharging.dto.request.AssignManagerRequest;
import com.pham.basis.evcharging.model.StationManager;
import com.pham.basis.evcharging.service.StationManagerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/station-managers")
public class StationManagerController {
    private final StationManagerService stationManagerService;

    @PostMapping("/assignManager")
    public ResponseEntity<StationManager> assignManager(@RequestBody @Valid AssignManagerRequest request){
        StationManager result = stationManagerService.assignManagerToStation(
                request.getUserId(), request.getStationId()
        );
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<StationManager>> getStationsByUser(@PathVariable Long userId) {
        List<StationManager> stations = stationManagerService.getStationsManagedByUser(userId);
        return ResponseEntity.ok(stations);
    }
}
