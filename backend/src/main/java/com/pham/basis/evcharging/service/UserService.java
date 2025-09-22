package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.request.UserCreationRequest;
import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;

// @Service: đánh dấu class thuộc tầng Service (xử lý nghiệp vụ)
// Cho phép Spring quản lý bean và inject vào nơi khác
@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    public User createUser(UserCreationRequest userCreationRequest) {
        User user = new User();
        user.setUsername(userCreationRequest.getUsername());
        user.setPassword(userCreationRequest.getPassword());
        user.setEmail(userCreationRequest.getEmail());
        user.setRole_id(userCreationRequest.getRole_id());

        return userRepository.save(user);
    }

    public boolean login(String username, String password) {
        User user = userRepository.findUserByUsername(username);
        if (user == null) {
            return false;
        }
        return user.getPassword().equals(password);
    }
}
