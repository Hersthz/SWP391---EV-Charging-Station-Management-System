package com.pham.basis.evcharging.service;

public interface EmailService {
    void sendVerificationEmail(String to, String subject, String body);
}
