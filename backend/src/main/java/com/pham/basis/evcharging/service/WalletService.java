package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.model.Wallet;
import com.pham.basis.evcharging.repository.UserRepository;
import com.pham.basis.evcharging.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class WalletService {
    private final WalletRepository walletRepository;
    private final UserRepository userRepository;

    public Wallet createWallet(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id " + userId));

        Optional<Wallet> wallet = walletRepository.findByUserId(userId);
        if (wallet.isPresent()) {
            return wallet.get();
        }

        Wallet newWallet = Wallet.builder()
                .user(user)
                .balance(BigDecimal.ZERO)
                .build();
        return  walletRepository.save(newWallet);
    }

    public Wallet getWalletbyUserId(Long userId) {
        return  walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with id " + userId));
    }


}
