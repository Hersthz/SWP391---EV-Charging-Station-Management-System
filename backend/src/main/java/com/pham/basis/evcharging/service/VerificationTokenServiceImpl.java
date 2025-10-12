package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.model.VerificationToken;
import com.pham.basis.evcharging.repository.VerificationTokenRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
@Service
public class VerificationTokenServiceImpl implements VerificationTokenService {

    private final VerificationTokenRepository tokenRepo;

    private final long EXPIRATION_HOURS = 24;

    public VerificationTokenServiceImpl(VerificationTokenRepository tokenRepo) {
        this.tokenRepo = tokenRepo;
    }

    @Override
    public String createVerificationToken(User user) {
        tokenRepo.deleteByUser(user);
        String token = UUID.randomUUID().toString();
        LocalDateTime expiration = LocalDateTime.now().plusHours(EXPIRATION_HOURS);
        VerificationToken vt = new VerificationToken(token,user,expiration);
        tokenRepo.save(vt);
        return token;
    }

    @Override
    @Transactional
    public User validateVerificationToken(String token) {
        Optional<VerificationToken> opt = tokenRepo.findByToken(token);
        if (opt.isEmpty()) return null;
        VerificationToken vt = opt.get();
        if (vt.getExpiryDate().isBefore(LocalDateTime.now())) {
            tokenRepo.delete(vt);
            return null;
        }
        return vt.getUser();
    }

    @Override
    @Transactional
    public void removeTokenByUser(User user) {
        tokenRepo.deleteByUser(user);
    }
}
