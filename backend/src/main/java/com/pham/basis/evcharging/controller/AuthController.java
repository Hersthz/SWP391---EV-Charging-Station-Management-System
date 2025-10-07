    package com.pham.basis.evcharging.controller;

    import com.pham.basis.evcharging.dto.request.LoginRequest;
    import com.pham.basis.evcharging.dto.request.UserCreationRequest;
    import com.pham.basis.evcharging.dto.response.UserResponse;
    import com.pham.basis.evcharging.service.AuthService;
    import jakarta.servlet.http.HttpServletResponse;
    import org.springframework.http.ResponseEntity;
    import org.springframework.web.bind.annotation.*;
    import org.springframework.security.core.Authentication;
    import java.util.Map;


    @RestController
    @RequestMapping("/auth")
    @CrossOrigin
    public class AuthController {
        private final AuthService authService;

        public AuthController(AuthService authService) {
            this.authService = authService;
        }

        @PostMapping("/register")
        public ResponseEntity<UserResponse> register(@RequestBody UserCreationRequest request) {
            return ResponseEntity.ok(authService.register(request));
        }

        @PostMapping("/login")
        public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletResponse response) {
            return authService.login(request, response);
        }

        @GetMapping("/verify")
        public ResponseEntity<Map<String, String>> verify(@RequestParam("token") String token) {
            return authService.verify(token);
        }

        @GetMapping("/me")
        public ResponseEntity<?> me(Authentication authentication) {
            return authService.getCurrentUser(authentication);
        }

        @PostMapping("/logout")
        public ResponseEntity<?> logout(HttpServletResponse response) {
            return authService.logout(response);
        }
    }
