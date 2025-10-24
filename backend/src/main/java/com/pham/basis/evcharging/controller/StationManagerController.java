package com.pham.basis.evcharging.controller;

import com.pham.basis.evcharging.dto.request.AssignManagerRequest;
import com.pham.basis.evcharging.dto.response.ChargingStationDetailResponse;
import com.pham.basis.evcharging.dto.response.StationManagerResponse;
import com.pham.basis.evcharging.exception.GlobalExceptionHandler;
import com.pham.basis.evcharging.model.ChargingStation;
import com.pham.basis.evcharging.service.StationAssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/station-managers")
public class StationManagerController {
    private final StationAssignmentService stationAssignmentService;

    @PostMapping("/assign")
    public ResponseEntity<Map<String, Object>> assignManager(@RequestBody @Valid AssignManagerRequest req) {
        boolean success = stationAssignmentService.assignManagerToStation(req.getUserId(), req.getStationId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", success);
        response.put("message", success ? "Manager assigned successfully." : "Failed to assign manager.");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ChargingStationDetailResponse> getStationByUser(@PathVariable Long userId) {
        if (userId == null || userId <= 0) {
            throw new GlobalExceptionHandler.BadRequestException("userId không hợp lệ");
        }
        ChargingStationDetailResponse station = stationAssignmentService.getStationByManager(userId);
        if (station == null) {
            throw new GlobalExceptionHandler.ResourceNotFoundException("Không tìm thấy trạm được gán cho người dùng");
        }
        return ResponseEntity.ok(station);
    }
}
