package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.request.ChangePasswordRequest;
import com.pham.basis.evcharging.dto.request.UpdateUserRequest;
import com.pham.basis.evcharging.dto.request.UserCreationRequest;
import com.pham.basis.evcharging.dto.response.ChangePasswordResponse;
import com.pham.basis.evcharging.dto.response.UpdateUserResponse;
import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.model.Role;
import com.pham.basis.evcharging.repository.UserRepository;
import com.pham.basis.evcharging.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;


import java.time.LocalDateTime;
import java.util.Objects;

@Service
public class UserServiceImpl implements UserService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

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
    public String getUserRole(String username) {
        User user = userRepository.findUserByUsername(username);
        if (user == null) throw new RuntimeException("User not found");
        return user.getRole().getName();
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
        }else {
            boolean changed = false;
            if (!Objects.equals(user.getFull_name(), full_name)) {
                user.setFull_name(full_name);
                changed = true;
            }
            if (emailVerified && !Boolean.TRUE.equals(user.getIs_verified())) {
                user.setIs_verified(true);
                changed = true;
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
        return userRepository.findUserByUsername( username);
    }

    @Override
    public UpdateUserResponse updateUserProfile(String userName, UpdateUserRequest request) {
//        User user = userRepository.findUserByUsername(userName);
//        if(user == null){
//            throw new RuntimeException("User not found");
//        }
//        user.setFull_name(request.getFull_name());
//
//        if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
//           // Does exist?
//            User existingUser = userRepository.findByPhone(request.getPhone());
//            if (existingUser != null && !existingUser.getUsername().equals(userName)) {
//                return new UpdateUserResponse(false, "Số điện thoại đã được sử dụng bởi tài khoản khác");
//            }
//            user.setPhone(request.getPhone());
//        }
        return null;
    }

    @Override
    public ChangePasswordResponse changePassword(String userName, ChangePasswordRequest request) {
        User user = userRepository.findUserByUsername(userName);
        if(user == null){
            throw new RuntimeException("User not found");
        }
        if("null".equals(user.getPassword())){
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

}
