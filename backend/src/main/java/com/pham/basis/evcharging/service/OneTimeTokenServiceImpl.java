package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.response.ApiResponse;
import com.pham.basis.evcharging.exception.GlobalExceptionHandler.BadRequestException;
import com.pham.basis.evcharging.model.OneTimeToken;
import com.pham.basis.evcharging.model.Reservation;
import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.repository.OneTimeTokenRepository;
import com.pham.basis.evcharging.repository.ReservationRepository;
import com.pham.basis.evcharging.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class OneTimeTokenServiceImpl implements OneTimeTokenService {

    private final OneTimeTokenRepository tokenRepo;
    private final ReservationRepository reservationRepo;
    private final UserRepository userRepo;

    // EMINUTES for token
    private static final int EMINUTES = 5;

    // base URL for frontend checkin page (adjust to your actual FE)
    private static final String CHECKIN_BASE = "https://your-fe.com/checkin?token=%s";


    @Transactional
    @Override
    public ApiResponse<Map<String, Object>> createToken(Long userId, Long reservationId) {
        // validate user
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        // validate reservation
        Reservation reservation = reservationRepo.findById(reservationId)
                .orElseThrow(() -> new BadRequestException("Reservation not found"));

        //kiem tra dung user khong
        if (!reservation.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Reservation does not belong to the user");
        }

        LocalDateTime now = LocalDateTime.now();

        List<OneTimeToken> existing = tokenRepo.findByReservationIdAndUsedFalseAndExpiryDateAfter(reservationId, now);
        if (existing != null && !existing.isEmpty()) {
            for (OneTimeToken t : existing) {
                tokenRepo.deleteByToken(t.getToken());
            }
        }

        String tokenStr = UUID.randomUUID().toString();
        OneTimeToken ott = OneTimeToken.builder()
                .token(tokenStr)
                .user(user)
                .reservation(reservation)
                .createdAt(now)
                .expiryDate(now.plusMinutes(EMINUTES))
                .used(false)
                .build();

        tokenRepo.save(ott);

        Map<String, Object> data = new HashMap<>();
        data.put("token", tokenStr);
        data.put("expiresAt", ott.getExpiryDate());
        data.put("qrUrl", String.format(CHECKIN_BASE, tokenStr));

        return new ApiResponse<>("200", "Token created", data);
    }


    @Transactional
    @Override
    public ApiResponse<Map<String, Object>> verifyToken(String tokenStr, Long userId) {

        OneTimeToken token = tokenRepo.findByToken(tokenStr)
                .orElseThrow(() -> new IllegalArgumentException("Invalid token"));

        if (!token.getUser().getId().equals(userId)) {
            throw new BadRequestException("Token does not belong to this user");
        }

        if (token.isUsed() || token.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Token invalid or expired");
        }

        LocalDateTime now = LocalDateTime.now();

        token.setUsed(true);
        token.setUsedAt(now);
        tokenRepo.save(token);

        Reservation reservation = token.getReservation();
        if (reservation == null) {
            throw new BadRequestException("Token is not bound to a reservation");
        }

        reservation.setStatus("VERIFIED");
        reservationRepo.save(reservation);

        Map<String, Object> data = new HashMap<>();
        data.put("reservationId", reservation.getId());
        data.put("userId", userId);
        data.put("newStatus", reservation.getStatus());

        return new ApiResponse<>("200", "Check-in successful", data);
    }
}
