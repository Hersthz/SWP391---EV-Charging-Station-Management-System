package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.request.CreateStaffRequest;
import com.pham.basis.evcharging.dto.request.ChangePasswordRequest;
import com.pham.basis.evcharging.dto.request.UpdateUserRequest;
import com.pham.basis.evcharging.dto.request.UserCreationRequest;
import com.pham.basis.evcharging.dto.response.*;
import com.pham.basis.evcharging.model.User;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;


public interface UserService {
    User createUser(UserCreationRequest userCreationRequest);
    User save(User user);
    User login(String username, String password);
    void createOrUpdateFromOAuth (String email, String full_name,boolean verified, String url);
    User findByEmail(String email);
    User findByUsername(String username);
    UpdateUserResponse updateUserProfile(String userName, UpdateUserRequest request, MultipartFile file);
    ChangePasswordResponse changePassword(String userName ,ChangePasswordRequest changePasswordRequest);
    CreateStaffResponse adminAddStaff(CreateStaffRequest req);
    String checkPass(User user);
    List<UserResponse> getAllUsers();
    String toggleBlockUser(Long id, Principal principal);
    SetUserRoleResponse setRoleForUser(String userName, String targetRoleName, boolean keepUserBaseRole);
    AssignStationResponse assignStationToUser(Long userId, Long stationId);

}

