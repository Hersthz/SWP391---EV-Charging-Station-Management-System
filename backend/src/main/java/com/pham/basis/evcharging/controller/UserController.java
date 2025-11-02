package com.pham.basis.evcharging.controller;


import com.pham.basis.evcharging.dto.request.ChangePasswordRequest;
import com.pham.basis.evcharging.dto.request.CreateStaffRequest;
import com.pham.basis.evcharging.dto.request.SetUserRoleRequest;
import com.pham.basis.evcharging.dto.request.UpdateUserRequest;
import com.pham.basis.evcharging.dto.response.*;
import com.pham.basis.evcharging.service.ReservationService;
import com.pham.basis.evcharging.service.Impl.UserServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/user")
@CrossOrigin
@RequiredArgsConstructor
public class UserController {

    private final UserServiceImpl userService;
    private final ReservationService reservationService;

    @PostMapping("/change-password")
    public ResponseEntity<ChangePasswordResponse> changePassword(
             @Valid @RequestBody ChangePasswordRequest request) {

        // Lấy username từ Security Context (người dùng đang đăng nhập)
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        ChangePasswordResponse response = userService.changePassword(username, request);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/update-profile")
    public ResponseEntity<UpdateUserResponse> updateProfile(@Valid @RequestBody UpdateUserRequest request) {
        // Lấy username từ Security Context (người dùng đang đăng nhập)
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        UpdateUserResponse response = userService.updateUserProfile(username, request);
            return ResponseEntity.ok(response);
    }

    @GetMapping("/{userId}/reservations")
    public ResponseEntity<List<ReservationResponse>> getUserReservations(@PathVariable Long userId) {
        List<ReservationResponse> response = reservationService.getReservationsByUser(userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/setRole")
    public ResponseEntity<SetUserRoleResponse>  setUserRole(@Valid @RequestBody SetUserRoleRequest request) {
        try {
            SetUserRoleResponse response = userService.setRoleForUser(request.getUsername(), request.getRoleName(), request.isKeepUserBaseRole());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            SetUserRoleResponse response = userService.setRoleForUser(request.getUsername(), request.getRoleName(), request.isKeepUserBaseRole());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/add-staff")
    public ResponseEntity<CreateStaffResponse> adminAddStaff(@Valid @RequestBody CreateStaffRequest request) {
        try {
            CreateStaffResponse response = userService.adminAddStaff(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> response = userService.getAllUsers();
        return ResponseEntity.ok(response);
    }
}
