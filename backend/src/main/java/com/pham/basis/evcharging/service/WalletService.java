package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.response.WalletResponse;
import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.model.Wallet;
import com.pham.basis.evcharging.repository.UserRepository;
import com.pham.basis.evcharging.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;
    private final UserRepository userRepository;

    public WalletResponse createWallet(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,"User not found with id " + userId));

        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseGet(() -> {
                    Wallet newWallet = Wallet.builder()
                            .user(user)
                            .balance(BigDecimal.ZERO)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();
                    return walletRepository.save(newWallet);
                });

        return mapToResponse(wallet);
    }

    public WalletResponse getWalletByUserId(Long userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,"Wallet not found for user with id " + userId));
        return mapToResponse(wallet);
    }

    private WalletResponse mapToResponse(Wallet wallet) {
        if (wallet == null) return null;

        return WalletResponse.builder()
                .id(wallet.getId())
                .userId(wallet.getUser() != null ? wallet.getUser().getId() : null)
                .balance(wallet.getBalance())
                .createdAt(wallet.getCreatedAt())
                .updatedAt(wallet.getUpdatedAt())
                .build();
    }
}
