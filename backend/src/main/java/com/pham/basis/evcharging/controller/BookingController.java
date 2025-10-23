package com.pham.basis.evcharging.controller;

import com.pham.basis.evcharging.dto.request.ReservationRequest;
import com.pham.basis.evcharging.dto.response.ReservationResponse;
import com.pham.basis.evcharging.service.ReservationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    @PostMapping("/{id}")
    public ResponseEntity<ReservationResponse> Plug(@PathVariable("id") Long reservationId) {
        ReservationResponse response = reservationService.updateStatus(reservationId);
        return ResponseEntity.ok(response);
    }

}
