package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.request.UserCreationRequest;
import com.pham.basis.evcharging.model.User;


public interface UserService {
    User getUserByName(String username);
    User createUser(UserCreationRequest userCreationRequest);
    User getAllUser();
    String getUserRole(String username);
    boolean updateUser(User user);
    boolean deleteUser(User user);
    User save(User user);
    User login(String username, String password);
}
