    package com.pham.basis.evcharging.controller;

    import com.pham.basis.evcharging.dto.request.LoginRequest;
    import com.pham.basis.evcharging.dto.request.UserCreationRequest;
    import com.pham.basis.evcharging.dto.response.ErrorResponse;
    import com.pham.basis.evcharging.dto.response.LoginResponse;
    import com.pham.basis.evcharging.dto.response.UserResponse;
    import jakarta.servlet.http.HttpServletResponse;
    import com.pham.basis.evcharging.model.User;
    import com.pham.basis.evcharging.service.EmailService;
    import com.pham.basis.evcharging.service.UserService;
    import com.pham.basis.evcharging.service.VerificationTokenService;
    import org.springframework.beans.factory.annotation.Autowired;
    import org.springframework.beans.factory.annotation.Value;
    import org.springframework.core.env.Environment;
    import org.springframework.http.HttpHeaders;
    import org.springframework.http.HttpStatus;
    import org.springframework.http.ResponseCookie;
    import org.springframework.http.ResponseEntity;
    import org.springframework.web.bind.annotation.*;
    import com.pham.basis.evcharging.security.JwtUtil;
    import org.springframework.security.core.Authentication;
    import java.util.Map;


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
        private String getFrontendBase() {
            return env.getProperty("app.frontend-url", "http://localhost:5173");
        }

        @Value("${jwt.expiration:86400000}")
        private long jwtExpiration;


        @PostMapping("/register")
        public ResponseEntity<UserResponse> createUser(@RequestBody UserCreationRequest request) {
            User user = userService.createUser(request);

            String token = tokenService.createVerificationToken(user);
            String link = getFrontendBase() + "/verify?token=" + token;
            emailService.sendVerificationEmail(user.getEmail(),"Verify your email", "Click here: "+ link);

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
        public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletResponse servletResponse) {
            try {
                User user =  userService.login(request.getUsername(), request.getPassword());
                if (Boolean.FALSE.equals(user.getIs_verified())) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(Map.of("message", "Email not verified! Please check your inbox."));
                }
                String roleName = user.getRole() != null ? user.getRole().getName() : "UNKNOWN";
                String token = jwtUtil.generateToken(request.getUsername(), user.getRole().getName());

                ResponseCookie cookie = ResponseCookie.from("JWT", token)
                        .httpOnly(true)
                        .secure(false)
                        .path("/")
                        .maxAge(jwtExpiration / 1000)
                        .sameSite("Lax")
                        .build();
                servletResponse.setHeader(HttpHeaders.SET_COOKIE, cookie.toString());
                LoginResponse response = new LoginResponse(request.getUsername(),roleName,user.getFull_name());
                return ResponseEntity.ok(response);
            }catch (RuntimeException e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse(e.getMessage()));
            }
        }

        @GetMapping("/verify")
        public ResponseEntity<Map<String, String>> verifyUser(@RequestParam("token") String token) {
            User user = tokenService.validateVerificationToken(token);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Invalid or expired verification token"));
            }
            if (Boolean.TRUE.equals(user.getIs_verified())) {
                return ResponseEntity.ok(Map.of("message", "Email already verified"));
            }
            user.setIs_verified(true);
            userService.save(user);
            tokenService.removeTokenByUser(user);
            return ResponseEntity.ok(Map.of("message", "Email verified successfully!"));
        }

        @GetMapping("/me")
        public ResponseEntity<?> me(Authentication authentication) {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not authenticated"));
            }
            String username = authentication.getName();
            User user = userService.findByUsername(username);
            if (user == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            UserResponse resp = new UserResponse(
                    user.getUser_id(),
                    user.getFull_name(),
                    user.getUsername(),
                    user.getEmail(),
                    user.getPhone(),
                    user.getRole() != null ? user.getRole().getName() : null
            );
            return ResponseEntity.ok(resp);
        }

        @PostMapping("/logout")
        public ResponseEntity<?> logout(HttpServletResponse response) {
            ResponseCookie cookie = ResponseCookie.from("JWT", "")
                    .httpOnly(true)
                    .path("/")
                    .maxAge(0)
                    .build();
            response.setHeader(HttpHeaders.SET_COOKIE, cookie.toString());
            return ResponseEntity.ok(Map.of("message", "Logged out"));
        }
    }
