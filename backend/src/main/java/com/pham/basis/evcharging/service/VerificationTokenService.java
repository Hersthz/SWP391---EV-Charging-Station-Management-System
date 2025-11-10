package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.model.User;

public interface VerificationTokenService {
    String createVerificationToken(User user, String type);
    User validateVerificationToken(String token, String type);
    void removeTokenByUser(User user);
}
