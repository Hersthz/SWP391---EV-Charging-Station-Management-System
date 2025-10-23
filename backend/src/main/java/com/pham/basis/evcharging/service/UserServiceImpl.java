package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.request.CreateStaffRequest;
import com.pham.basis.evcharging.dto.request.ChangePasswordRequest;
import com.pham.basis.evcharging.dto.request.UpdateUserRequest;
import com.pham.basis.evcharging.dto.request.UserCreationRequest;
import com.pham.basis.evcharging.dto.response.CreateStaffResponse;
import com.pham.basis.evcharging.dto.response.ChangePasswordResponse;
import com.pham.basis.evcharging.dto.response.UpdateUserResponse;
import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.model.Role;
import com.pham.basis.evcharging.repository.SubscriptionPlanRepository;
import com.pham.basis.evcharging.repository.UserRepository;
import com.pham.basis.evcharging.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;


import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final WalletService walletService;
    private final SubscriptionPlanRepository planRepository;

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
        public CreateStaffResponse adminAddStaff(CreateStaffRequest req) {

            final String email    = req.getEmail().toLowerCase().trim();
            final String username = req.getUsername().toLowerCase().trim();
            final String phone    = req.getPhone().trim();

            if (userRepository.existsByEmail(email))
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
            if (userRepository.existsByPhone(phone))
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Phone already exists");
            if (userRepository.existsByUsername(username))
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists"); // 409 [web:20][web:3]

            Role role = roleRepository.findById(req.getRoleId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid roleId")); // 400 [web:20]

            // Password: dùng input, nếu trống đặt "1" (dev); production nên generate ngẫu nhiên
            final String rawPwd = Optional.ofNullable(req.getPassword())
                    .map(String::trim)
                    .filter(p -> !p.isBlank())
                    .orElse("1"); // CHỈ nên dùng ở dev [web:14][web:17]

            User u = new User();
            u.setFull_name(req.getFull_name().trim());
            u.setUsername(username);
            u.setEmail(email);
            u.setPhone(phone);
            u.setRole(role);

            User saved = userRepository.save(u);           // JPA save [web:20]
            CreateStaffResponse res = new CreateStaffResponse();
            res.setUser_id(saved.getId());
            res.setFull_name(saved.getFull_name());
            res.setUsername(saved.getUsername());
            res.setEmail(saved.getEmail());
            res.setPhone(saved.getPhone());
            res.setRoleCode(saved.getRole() != null ? saved.getRole().getId() : null);
            return res;
        }
    }


