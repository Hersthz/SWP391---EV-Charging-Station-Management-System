package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.request.UserCreationRequest;
import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.model.Role;
import com.pham.basis.evcharging.repository.UserRepository;
import com.pham.basis.evcharging.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


import java.time.LocalDateTime;

@Service
public class UserServiceImpl implements UserService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RoleRepository roleRepository;


    @Override
    public User getUserByName(String username) {
        return null;
    }

    @Override
    public User createUser(UserCreationRequest request) {
        User user = new User();
        user.setFull_name(request.getFull_name());
        user.setUsername(request.getUsername());
        user.setPassword(request.getPassword());
        user.setEmail(request.getEmail());
        user.setCreated_at(LocalDateTime.now());
        Role defaultRole = roleRepository.getReferenceById(1);
        user.setRole(defaultRole);
        return userRepository.save(user);
    }

    @Override
    public User getAllUser() {
        return null;
    }

    @Override
    public String getUserRole(String username) {
        User user = userRepository.findUserByUsername(username);
        if (user == null) throw new RuntimeException("User not found");
        return user.getRole().getName();
    }


    @Override
    public boolean updateUser(User user) {
        return false;
    }

    @Override
    public boolean deleteUser(User user) {
        return false;
    }

    @Override
    public User login(String username, String password) {
        User user = userRepository.findUserByUsername(username);
        if (user == null || !password.equals(user.getPassword())) {
            throw new RuntimeException("Invalid username or password");
        }
        return user;
    }
}
