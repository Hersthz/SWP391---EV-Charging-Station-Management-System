package com.pham.basis.evcharging.controller;

import com.pham.basis.evcharging.dto.request.UserCreationRequest;
import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserController {
    @Autowired
    private UserService userService;

    @PostMapping("/register")
    User createUser(@RequestBody UserCreationRequest userCreationRequest) {
        return userService.createUser(userCreationRequest);
    }
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserCreationRequest request) {
        boolean success = userService.login(request.getUsername(), request.getPassword());
        if (!success) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("username or password is incorrect");
        }
        return ResponseEntity.ok("logged in");
    }
}
