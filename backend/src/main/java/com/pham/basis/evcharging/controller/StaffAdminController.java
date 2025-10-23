package com.pham.basis.evcharging.controller;


import com.pham.basis.evcharging.dto.request.CreateStaffRequest;
import com.pham.basis.evcharging.dto.response.CreateStaffResponse;
import com.pham.basis.evcharging.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class StaffAdminController {

    @Autowired
    private UserService userService;

    @PostMapping("/createStaff")
    public ResponseEntity<CreateStaffResponse> create(@Valid @RequestBody CreateStaffRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.adminAddStaff(req));
    }
}
