package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.request.ReservationRequest;
import com.pham.basis.evcharging.dto.response.ReservationResponse;
import org.springframework.stereotype.Service;

import java.util.List;


public interface ReservationService {
    ReservationResponse createReservation(ReservationRequest reservationRequest);
    List<ReservationResponse> getReservationsByUser(Long userId);
    ReservationResponse updateStatus(Long reservationId);
}
