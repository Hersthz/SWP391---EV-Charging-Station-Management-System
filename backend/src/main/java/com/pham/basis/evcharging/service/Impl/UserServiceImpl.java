package com.pham.basis.evcharging.service.Impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pham.basis.evcharging.dto.request.CreateStaffRequest;
import com.pham.basis.evcharging.dto.request.ChangePasswordRequest;
import com.pham.basis.evcharging.dto.request.UpdateUserRequest;
import com.pham.basis.evcharging.dto.request.UserCreationRequest;
import com.pham.basis.evcharging.dto.response.*;
import com.pham.basis.evcharging.exception.AppException;
import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.model.Role;
import com.pham.basis.evcharging.model.Vehicle;
import com.pham.basis.evcharging.repository.UserRepository;
import com.pham.basis.evcharging.repository.RoleRepository;
import com.pham.basis.evcharging.repository.VehicleRepository;
import com.pham.basis.evcharging.service.UserService;
import com.pham.basis.evcharging.service.WalletService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;


import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final WalletService walletService;

    @Override
    public User createUser(UserCreationRequest request) {
        User user = new User();
        user.setFullName(request.getFull_name());
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setIsVerified(false);
        user.setCreatedAt(LocalDateTime.now());
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
        User user = userRepository.findUserByUsername(username)
                .orElseThrow(() -> new AppException.UnauthorizedException("Invalid username or password"));

        if (user.getPassword() == null || "null".equals(user.getPassword())) {
            throw new AppException.BadRequestException("Account registered with Google. Please login with Google");
        }
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new AppException.UnauthorizedException("Invalid username or password");
        }
        if (!Boolean.TRUE.equals(user.getIsVerified())) {
            throw new AppException.ForbiddenException("Email not verified");
        }

        return user;
    }

    @Override
    @Transactional
    public void createOrUpdateFromOAuth(String email, String full_name, boolean emailVerified) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            User u = new User();
            u.setEmail(email);
            u.setUsername(email);
            u.setFullName(full_name);
            u.setIsVerified(emailVerified);
            u.setPassword("null");
            Role defaultRole = roleRepository.getReferenceById(1);
            u.setRole(defaultRole);
            u.setCreatedAt(LocalDateTime.now());
            userRepository.save(u);
            if (emailVerified) {
                walletService.createWallet(u.getId());

            }
        } else {
            boolean changed = false;
            if (emailVerified && !Boolean.TRUE.equals(user.getIsVerified())) {
                user.setIsVerified(true);
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
        return userRepository.findUserByUsername(username)
                .orElseThrow(() -> new AppException.NotFoundException("User not found"));
    }

    @Override
    public UpdateUserResponse updateUserProfile(String userName, UpdateUserRequest request) {
        User user = userRepository.findUserByUsername(userName)
                .orElseThrow(() -> new AppException.NotFoundException("User not found"));
        user.setFullName(request.getFull_name());
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
            user.setIsVerified(true);
        }
        user.setDateOfBirth(request.getDate_of_birth());
        User updatedUser = userRepository.save(user);
        UpdateUserResponse data = new UpdateUserResponse();
        data.setFullName(updatedUser.getFullName());
        data.setEmail(updatedUser.getEmail());
        data.setPhone(updatedUser.getPhone());
        data.setDateOfBirth(updatedUser.getDateOfBirth());

        return data;
    }

    @Override
    public ChangePasswordResponse changePassword(String userName, ChangePasswordRequest request) {
        User user = userRepository.findUserByUsername(userName)
                .orElseThrow(() -> new AppException.NotFoundException("User not found"));

        // Trường hợp account đăng nhập bằng Google
        if (user.getPassword() == null || "null".equals(user.getPassword())) {
            return new ChangePasswordResponse(false,
                    "Google account cannot change password");
        }
        // Kiểm tra mật khẩu hiện tại
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            return new ChangePasswordResponse(false, "The current password is incorrect");
        }
        // Kiểm tra mật khẩu mới và xác nhận
        if (!Objects.equals(request.getNewPassword(), request.getConfirmPassword())) {
            return new ChangePasswordResponse(false, "The confirmation password does not match");
        }
        // Không cho phép đặt lại cùng mật khẩu cũ
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            return new ChangePasswordResponse(false,
                    "The new password must be different from the current password");
        }
        // Cập nhật mật khẩu
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        return new ChangePasswordResponse(true, "Password changed successfully");
    }


    public SetUserRoleResponse setRoleForUser(String userName, String targetRoleName, boolean keepUserBaseRole) {
        User user = userRepository.findUserByUsername(userName)
                .orElseThrow(() -> new AppException.NotFoundException("User not found"));

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
        return new SetUserRoleResponse(userName,targetRoleName,keepUserBaseRole);
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
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");

        Role role = roleRepository.findById(req.getRoleId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid roleId"));

        // ✅ LẤY PWD ĐẦU VÀO, FALLBACK DEV "1", RỒI MÃ HOÁ
        final String rawPwd = Optional.ofNullable(req.getPassword())
                .map(String::trim)
                .filter(p -> !p.isBlank())
                .orElse("1"); // chỉ để dev
        final String hashed = passwordEncoder.encode(rawPwd);

        User u = new User();
        u.setFullName(req.getFullName().trim());
        u.setUsername(username);
        u.setEmail(email);
        u.setPhone(phone);
        u.setRole(role);
        u.setPassword(hashed);             // ✅ BẮT BUỘC: set password
        u.setIsVerified(true);             // khuyến nghị mặc định đã xác minh khi admin tạo
        u.setCreatedAt(LocalDateTime.now());
        // nếu có cột status NOT NULL:
        // u.setStatus(true);

        User saved = userRepository.save(u);

        // (tuỳ chọn) tạo ví cho staff nếu hệ thống yêu cầu
        // walletService.createWallet(saved.getId());

        CreateStaffResponse res = new CreateStaffResponse();
        res.setUser_id(saved.getId());
        res.setFull_name(saved.getFullName());
        res.setUsername(saved.getUsername());
        res.setEmail(saved.getEmail());
        res.setPhone(saved.getPhone());
        res.setRoleCode(saved.getRole() != null ? saved.getRole().getId() : 0);
        return res;
    }


    @Override
    public List<UserResponse> getAllUsers() {
        List<User> users = userRepository.findAll();
        return users.stream()
                .map(user -> UserResponse.builder()
                        .id(user.getId())
                        .fullName(user.getFullName())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .phone(user.getPhone())
                        .status(user.getStatus())
                        .isVerified(user.getIsVerified())
                        .roleName(user.getRole().getName())
                        .dateOfBirth(user.getDateOfBirth())
                        .createdAt(user.getCreatedAt())
                        .build())
                .toList();
    }


}


