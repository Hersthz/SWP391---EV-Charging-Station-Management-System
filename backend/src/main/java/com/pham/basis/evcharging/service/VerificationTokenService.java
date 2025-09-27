package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.model.User;

public interface VerificationTokenService {
    String createVerificationToken(User user);
    User validateVerificationToken(String token);
    void removeTokenByUser(User user);
}
