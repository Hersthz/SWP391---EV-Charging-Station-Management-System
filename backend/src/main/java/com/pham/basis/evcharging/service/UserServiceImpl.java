package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.request.StaffCreationRequest;
import com.pham.basis.evcharging.dto.request.ChangePasswordRequest;
import com.pham.basis.evcharging.dto.request.UpdateUserRequest;
import com.pham.basis.evcharging.dto.request.UserCreationRequest;
import com.pham.basis.evcharging.dto.response.*;
import com.pham.basis.evcharging.model.ChargingStation;
import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.model.Role;
import com.pham.basis.evcharging.repository.ChargingStationRepository;
import com.pham.basis.evcharging.repository.SubscriptionPlanRepository;
import com.pham.basis.evcharging.repository.UserRepository;
import com.pham.basis.evcharging.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;


import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    @Autowired
    private final UserRepository userRepository;
    @Autowired
    private final RoleRepository roleRepository;
    @Autowired
    private final PasswordEncoder passwordEncoder;
    @Autowired
    private final WalletService walletService;
    @Autowired
    private final SubscriptionPlanRepository planRepository;
    @Autowired
    private final ChargingStationRepository stationRepository;
    @Override
    public User createUser(UserCreationRequest request) {
        User user = new User();
        user.setFull_name(request.getFull_name());
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setIs_verified(false);
        user.setCreated_at(LocalDateTime.now());
        Role defaultRole = roleRepository.getReferenceById(1);
        user.setRole(defaultRole);
        return userRepository.save(user);
    }

    @Override
    public User save(User user) {
        return userRepository.save(user);
    }

    @Override
    public User login(String username, String password) {
        User user = userRepository.findUserByUsername(username);
        if (user == null || !passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid username or password");
        }
        return user;
    }

    @Override
    public void createOrUpdateFromOAuth(String email, String full_name, boolean emailVerified) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            User u = new User();
            u.setEmail(email);
            u.setUsername(email);
            u.setFull_name(full_name);
            u.setIs_verified(emailVerified);
            u.setPassword("null");
            Role defaultRole = roleRepository.getReferenceById(1);
            u.setRole(defaultRole);
            u.setCreated_at(LocalDateTime.now());
            userRepository.save(u);
            if(emailVerified) walletService.createWallet(u.getId());
        } else {
            boolean changed = false;
            if (emailVerified && !Boolean.TRUE.equals(user.getIs_verified())) {
                user.setIs_verified(true);
                changed = true;
                walletService.createWallet(user.getId());
            }
            if (changed) userRepository.save(user);
        }
    }

    @Override
    public User findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public User findByUsername(String username) {
        return userRepository.findUserByUsername(username);
    }

    @Override
    public User findByPhone(String phone) {
        return userRepository.findByPhone(phone);
    }

    @Override
    public UpdateUserResponse updateUserProfile(String userName, UpdateUserRequest request) {
        User user = userRepository.findUserByUsername(userName);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        user.setFull_name(request.getFull_name());
        //Kiem tra phone number
        if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
            // Does exist?
            User existingUser = userRepository.findByPhone(request.getPhone());
            if (existingUser != null && !existingUser.getUsername().equals(userName)) {
                throw new RuntimeException("The phone number has already been used by another account");
            }
            user.setPhone(request.getPhone());
        }
        if (!user.getEmail().equals(request.getEmail())) {
            User existingUser = userRepository.findByEmail(request.getEmail());
            if (existingUser != null && !existingUser.getUsername().equals(userName)) {
                throw new RuntimeException("The email has already been used by another account");
            }
            //can verify khi doi email
            user.setEmail(request.getEmail());
            user.setIs_verified(true);
        }
        user.setDate_of_birth(request.getDate_of_birth());
        User updatedUser = userRepository.save(user);
        UpdateUserResponse data = new UpdateUserResponse();
        data.setFullName(updatedUser.getFull_name());
        data.setEmail(updatedUser.getEmail());
        data.setPhone(updatedUser.getPhone());
        data.setDateOfBirth(updatedUser.getDate_of_birth());

        return data;
    }

    @Override
    public ChangePasswordResponse changePassword(String userName, ChangePasswordRequest request) {
        User user = userRepository.findUserByUsername(userName);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        if ("null".equals(user.getPassword())) {
            return new ChangePasswordResponse(false,
                    "Google's account can not change password");
        }
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            return new ChangePasswordResponse(false, "The current password is incorrect");
        }
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            return new ChangePasswordResponse(false, "The confirmation password does not match");
        }
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            return new ChangePasswordResponse(false,
                    "The new password must be different from the current password");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return new ChangePasswordResponse(true, "Change password successfully");

    }

    public void setRoleForUser(String username, String targetRoleName, boolean keepUserBaseRole) {
        User user = userRepository.findUserByUsername(username);
        if (user == null) {
            throw new IllegalArgumentException("User not found: " + username);
        }

        Role targetRole = roleRepository.findByName(targetRoleName);
        if (targetRole == null) {
            throw new IllegalArgumentException("Role not found: " + targetRoleName);
        }

        Set<Role> newRoles = new HashSet<>();
        newRoles.add(targetRole);

        if (keepUserBaseRole) {
            Role baseUser = roleRepository.findByName("ROLE_USER");
            if (baseUser != null) {
                newRoles.add(baseUser);
            }
        }
    }
    @Override
    @Transactional
    public StaffCreationResponse createStaff(StaffCreationRequest req) {

        final String email = req.getEmail().toLowerCase().trim();
        final String username = req.getUsername().toLowerCase().trim();
        final String phone = req.getPhone().trim();
        final String fullName = req.getFull_name().trim();

        // Check duplicates
        if (userRepository.existsByEmail(email))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        if (userRepository.existsByPhone(phone))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Phone already exists");
        if (userRepository.existsByUsername(username))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");

        // Validate role
        Role role = roleRepository.findById(req.getRoleId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid roleId"));

        // Password handling
        final String rawPwd = Optional.ofNullable(req.getPassword())
                .map(String::trim)
                .filter(p -> !p.isBlank())
                .orElse("Temp123!"); // Simple default

        // ✅ Hash password
        String hashedPassword = passwordEncoder.encode(rawPwd);

        // Create user
        User u = new User();
        u.setFull_name(fullName);
        u.setUsername(username);
        u.setEmail(email);
        u.setPhone(phone);
        u.setPassword(hashedPassword); // Use hashed password
        u.setRole(role);
        u.setStatus(true);
        u.setCreated_at(java.time.LocalDateTime.now()); // Add timestamp

        User saved = userRepository.save(u);

        // Build response
        StaffCreationResponse res = new StaffCreationResponse();
        res.setUser_id(saved.getId());
        res.setFull_name(saved.getFull_name());
        res.setUsername(saved.getUsername());
        res.setEmail(saved.getEmail());
        res.setPhone(saved.getPhone());
        res.setRoleCode(saved.getRole() != null ? saved.getRole().getId() : null);
        res.setMessage("Staff created successfully");
        res.setTempPassword(rawPwd); // Return temp password for first login

        return res;
    }

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToUserResponse)
                .toList();
    }


    // Helper method - Simple password generation
    private String generateSimplePassword() {
        // For development: "Temp123!"
        // In production: use more secure generation
        return "Temp123!";
    }

    private UserResponse convertToUserResponse(User user) {
        UserResponse response = new UserResponse();
        response.setUser_id(user.getId());
        response.setFull_name(user.getFull_name());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setPhone(user.getPhone());
        response.setRoleId(user.getRole().getId()); // Assume you have this method
        return response;
    }

    @Override
    public List<ChargingStationResponse> getAllStations() {
        return stationRepository.findAll().stream()
                .map(this::convertToStationResponse)
                .toList();
    }

    private ChargingStationResponse convertToStationResponse(ChargingStation station) {
        ChargingStationResponse response = new ChargingStationResponse();
        response.setId(station.getId());
        response.setName(station.getName());
        response.setAddress(station.getAddress());
        response.setStatus(station.getStatus());
        response.setManagerId(station.getManager().getId());
        return response;
    }
}


