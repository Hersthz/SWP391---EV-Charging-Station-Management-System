package com.pham.basis.evcharging.controller;


import com.pham.basis.evcharging.dto.request.*;
import com.pham.basis.evcharging.dto.response.*;
import com.pham.basis.evcharging.exception.AppException;
import com.pham.basis.evcharging.service.ReservationService;
import com.pham.basis.evcharging.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/user")
@CrossOrigin
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
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

    @PostMapping(value = "/update-profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UpdateUserResponse> updateProfile(
            @RequestPart("data") @Valid UpdateUserRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        UpdateUserResponse response = userService.updateUserProfile(username, request, file);
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


    @GetMapping("/pass")
    public ResponseEntity<ApiResponse<String>> checkPass(Principal principal){
        if(principal == null){ throw new AppException.UnauthorizedException("Unauthorized");}
        String check = userService.checkPass(userService.findByUsername(principal.getName()));
        return ResponseEntity.ok(new ApiResponse<>("200","Check Pass Success",check));
    }

    @PutMapping("/block/{id}")
    public ResponseEntity<ApiResponse<String>> toggleBlockAccount(
            @PathVariable Long id,
            Principal principal
    ) {
        String message = userService.toggleBlockUser(id, principal);

        return ResponseEntity.ok(
                ApiResponse.<String>builder()
                        .code("200")
                        .message(message)
                        .build()
        );

    }
}
