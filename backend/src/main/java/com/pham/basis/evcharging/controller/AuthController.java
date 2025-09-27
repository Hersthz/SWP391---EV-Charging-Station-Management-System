package com.pham.basis.evcharging.controller;

import com.pham.basis.evcharging.dto.request.LoginRequest;
import com.pham.basis.evcharging.dto.request.UserCreationRequest;
import com.pham.basis.evcharging.dto.response.ErrorResponse;
import com.pham.basis.evcharging.dto.response.LoginResponse;
import com.pham.basis.evcharging.dto.response.UserResponse;
import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.service.EmailService;
import com.pham.basis.evcharging.service.UserService;
import com.pham.basis.evcharging.service.VerificationTokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
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
    @Autowired
    private VerificationTokenService tokenService;
    @Autowired
    private Environment env;
    @Autowired
    private EmailService emailService;

    private String getBaseUrl() {
        return env.getProperty("app.base-url", "http://localhost:8080");
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> createUser(@RequestBody UserCreationRequest request) {
        User user = userService.createUser(request);

        String token = tokenService.createVerificationToken(user);
        String link = getBaseUrl() + "/identity/auth/verify?token=" + token;
        emailService.sendVerificationEmail(user.getEmail(),"Verify your email", "Click here: "+ link);
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
            String token = jwtUtil.generateToken(request.getUsername(), user.getRole().getName());
            LoginResponse response = new LoginResponse(token,request.getUsername(),roleName,user.getFull_name());
            return ResponseEntity.ok(response);
        }catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse(e.getMessage()));
        }
    }
    @GetMapping("/verify")
    public ResponseEntity<String> verifyUser(@RequestParam("token") String token) {
        User user = tokenService.validateVerificationToken(token);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Invalid or expired verification token");
        }

        // cập nhật trạng thái user = active (hoặc enabled = true)
        user.setIs_verified(true);
        userService.save(user);

        // xoá token sau khi verify thành công
        tokenService.removeTokenByUser(user);

        return ResponseEntity.ok("Email verified successfully!");
    }
}
