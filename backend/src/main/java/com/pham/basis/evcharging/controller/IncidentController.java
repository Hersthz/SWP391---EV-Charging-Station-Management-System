package com.pham.basis.evcharging.controller;


import com.pham.basis.evcharging.dto.request.IncidentRequest;
import com.pham.basis.evcharging.dto.response.ApiResponse;
import com.pham.basis.evcharging.dto.response.IncidentResponse;
import com.pham.basis.evcharging.service.IncidentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/incidents")
public class IncidentController {
    private final IncidentService  incidentService;

    @PostMapping
    public ResponseEntity<ApiResponse<String>> reportIncident(@Valid @RequestBody IncidentRequest request) {
        incidentService.createIncident(request);
        return ResponseEntity.ok(new ApiResponse<>("200","Response succesfully","Report successfully"));
    }

    @GetMapping("/getAll")
    public ResponseEntity<ApiResponse<List<IncidentResponse>>> getAllIncidents() {
        List<IncidentResponse> incidentResponses = incidentService.getAllIncident();
        return ResponseEntity.ok(new ApiResponse<List<IncidentResponse>>("200","Get All incident",incidentResponses));
    }
}
