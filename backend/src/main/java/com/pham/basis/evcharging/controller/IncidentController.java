package com.pham.basis.evcharging.controller;


import com.pham.basis.evcharging.dto.request.IncidentRequest;
import com.pham.basis.evcharging.model.Incident;
import com.pham.basis.evcharging.service.IncidentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/incidents")
public class IncidentController {
    private final IncidentService  incidentService;

    @PostMapping
    public ResponseEntity<String> reportIncident(@RequestBody IncidentRequest request) {
        incidentService.createIncident(request);
        return ResponseEntity.ok("Incident reported successfully");
    }
}
