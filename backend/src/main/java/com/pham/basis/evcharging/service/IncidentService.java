package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.request.IncidentRequest;

public interface IncidentService {
    void createIncident(IncidentRequest request);
}
