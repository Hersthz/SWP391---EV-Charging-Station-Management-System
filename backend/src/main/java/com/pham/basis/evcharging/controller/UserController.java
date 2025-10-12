package com.pham.basis.evcharging.controller;


import com.pham.basis.evcharging.dto.request.ChangePasswordRequest;
import com.pham.basis.evcharging.dto.request.UpdateUserRequest;
import com.pham.basis.evcharging.dto.response.ChangePasswordResponse;
import com.pham.basis.evcharging.dto.response.UpdateUserResponse;
import com.pham.basis.evcharging.service.UserServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user")
@CrossOrigin
@RequiredArgsConstructor
public class UserController {

    private final UserServiceImpl userService;

    @PostMapping("/change-password")
    public ResponseEntity<ChangePasswordResponse> changePassword(
             @RequestBody ChangePasswordRequest request) {

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

    @PutMapping("/update-profile")
    public ResponseEntity<UpdateUserResponse> updateProfile(@RequestBody UpdateUserRequest request) {
        // Lấy username từ Security Context (người dùng đang đăng nhập)
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        UpdateUserResponse response = userService.updateUserProfile(username, request);
        if(response.isSuccess()){
            return ResponseEntity.ok(response);
        }else{
            return ResponseEntity.badRequest().body(response);
        }

    }



}
