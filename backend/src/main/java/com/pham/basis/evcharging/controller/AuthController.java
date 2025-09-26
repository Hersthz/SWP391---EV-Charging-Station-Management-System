package com.pham.basis.evcharging.controller;

import com.pham.basis.evcharging.dto.request.LoginRequest;
import com.pham.basis.evcharging.dto.request.UserCreationRequest;
import com.pham.basis.evcharging.dto.response.ErrorResponse;
import com.pham.basis.evcharging.dto.response.LoginResponse;
import com.pham.basis.evcharging.dto.response.UserResponse;
import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.pham.basis.evcharging.security.JwtUtil;


@RestController
@RequestMapping("/auth")
@CrossOrigin
public class AuthController {
    @Autowired
    private UserService userService;
    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<UserResponse> createUser(@RequestBody UserCreationRequest request) {
        User user = userService.createUser(request);
        // map entity -> DTO
        UserResponse response = new UserResponse(
                user.getUser_id(),
                user.getFull_name(),
                user.getUsername(),
                user.getEmail(),
                user.getPhone(),
                user.getRole().getName()
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            User user =  userService.login(request.getUsername(), request.getPassword());
            String roleName = user.getRole() != null ? user.getRole().getName() : "UNKNOWN";
            String token = jwtUtil.generateToken(request.getUsername());
            LoginResponse response = new LoginResponse(token,request.getUsername(),roleName,user.getFull_name());
            return ResponseEntity.ok(response);
        }catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse(e.getMessage()));
        }
    }
}
