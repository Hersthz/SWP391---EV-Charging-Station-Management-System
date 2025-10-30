package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.request.IncidentRequest;
import com.pham.basis.evcharging.dto.response.IncidentResponse;

import java.util.List;

public interface IncidentService {
    void createIncident(IncidentRequest request);
    List<IncidentResponse> getAllIncident();
}
