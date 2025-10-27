package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.request.StaffCreationRequest;
import com.pham.basis.evcharging.dto.request.ChangePasswordRequest;
import com.pham.basis.evcharging.dto.request.UpdateUserRequest;
import com.pham.basis.evcharging.dto.request.UserCreationRequest;
import com.pham.basis.evcharging.dto.response.*;
import com.pham.basis.evcharging.model.User;

import java.util.List;


public interface UserService {
    User createUser(UserCreationRequest userCreationRequest);
    User save(User user);
    User login(String username, String password);
    void createOrUpdateFromOAuth (String email, String full_name,boolean verified);
    User findByEmail(String email);
    User findByUsername(String username);
    UpdateUserResponse updateUserProfile(String userName, UpdateUserRequest request);
    ChangePasswordResponse changePassword(String userName ,ChangePasswordRequest changePasswordRequest);
    User findByPhone(String phone);
    void setRoleForUser(String username, String targetRoleName, boolean keepUserBaseRole);
    StaffCreationResponse createStaff(StaffCreationRequest req);
    List<UserResponse> getAllUsers();
    List<ChargingStationResponse> getAllStations();
}

