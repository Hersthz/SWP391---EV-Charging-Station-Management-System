package com.pham.basis.evcharging.controller;

import com.pham.basis.evcharging.dto.request.ReservationRequest;
import com.pham.basis.evcharging.dto.response.ReservationResponse;
import com.pham.basis.evcharging.service.ReservationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/book")
public class BookingController {

    private final ReservationService reservationService;

    @PostMapping("/booking")
    public ResponseEntity<ReservationResponse> booking(@Valid @RequestBody ReservationRequest request) {
        ReservationResponse response = reservationService.createReservation(request);
        return ResponseEntity.ok(response);
    }
}
