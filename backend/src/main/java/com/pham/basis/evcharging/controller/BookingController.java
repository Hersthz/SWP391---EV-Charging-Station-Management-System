package com.pham.basis.evcharging.controller;

import com.pham.basis.evcharging.dto.request.ReservationRequest;
import com.pham.basis.evcharging.dto.response.ApiResponse;
import com.pham.basis.evcharging.dto.response.ReservationResponse;
import com.pham.basis.evcharging.exception.AppException;
import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.service.ReservationService;
import com.pham.basis.evcharging.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequiredArgsConstructor
@RequestMapping("/book")
public class BookingController {

    private final ReservationService reservationService;
    private final UserService userService;

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

    @PostMapping("/cancel/{id}")
    public ResponseEntity<ApiResponse<ReservationResponse>> cancelBooking(@PathVariable Long id, Principal principal) {
        if (principal == null) {
            throw new AppException.NotFoundException("User not found for this token");
        }
        User user = userService.findByUsername(principal.getName());
        reservationService.cancel(id, user);
        return ResponseEntity.ok(new ApiResponse<ReservationResponse>("200","Reservation Canceled",null));
    }

}
