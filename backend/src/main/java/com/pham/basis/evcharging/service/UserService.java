package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.request.UserCreationRequest;
import com.pham.basis.evcharging.model.User;


public interface UserService {
    User createUser(UserCreationRequest userCreationRequest);
    String getUserRole(String username);
    User save(User user);
    User login(String username, String password);
    void createOrUpdateFromOAuth (String email, String full_name,boolean verified);
    User findByEmail(String email);
    User findByUsername(String username);
}
