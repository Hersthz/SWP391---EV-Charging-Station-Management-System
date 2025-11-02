package com.pham.basis.evcharging.service.Impl;

import com.pham.basis.evcharging.dto.response.OneTimeTokenResponse;
import com.pham.basis.evcharging.dto.response.VerifyTokenResponse;
import com.pham.basis.evcharging.exception.AppException;
import com.pham.basis.evcharging.model.OneTimeToken;
import com.pham.basis.evcharging.model.Reservation;
import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.repository.OneTimeTokenRepository;
import com.pham.basis.evcharging.repository.ReservationRepository;
import com.pham.basis.evcharging.repository.UserRepository;
import com.pham.basis.evcharging.service.OneTimeTokenService;
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

    // base URL for frontend checkin page
    private static final String CHECKIN_BASE = "https://your-fe.com/checkin?token=%s";


    @Override
    @Transactional
    public OneTimeTokenResponse createToken(Long userId, Long reservationId) {
        // load
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new AppException.NotFoundException("User not found"));
        Reservation reservation = reservationRepo.findById(reservationId)
                .orElseThrow(() -> new AppException.NotFoundException("Reservation not found"));

        // check owner
        if (!reservation.getUser().getId().equals(user.getId())) {
            throw new AppException.BadRequestException("Reservation does not belong to the user");
        }

        // remove existing valid tokens for this reservation
        List<OneTimeToken> existing = tokenRepo.findByReservationIdAndUsedFalseAndExpiryDateAfter(reservationId, LocalDateTime.now());
        if (existing != null && !existing.isEmpty()) {
            tokenRepo.deleteAll(existing);
        }

        // create token
        String tokenStr = UUID.randomUUID().toString();
        OneTimeToken ott = OneTimeToken.builder()
                .token(tokenStr)
                .user(user)
                .reservation(reservation)
                .createdAt(LocalDateTime.now())
                .expiryDate(LocalDateTime.now().plusMinutes(EMINUTES))
                .used(false)
                .build();

        OneTimeToken saved = tokenRepo.save(ott);

        OneTimeTokenResponse resp = OneTimeTokenResponse.builder()
                .token(saved.getToken())
                .expiresAt(saved.getExpiryDate())
                .qrUrl(String.format(CHECKIN_BASE, saved.getToken()))
                .build();

        return resp;
    }


    @Override
    @Transactional
    public VerifyTokenResponse verifyToken(String tokenStr, Long userId) {
        OneTimeToken token = tokenRepo.findByToken(tokenStr)
                .orElseThrow(() -> new AppException.BadRequestException("Invalid token"));

        if (!token.getUser().getId().equals(userId)) {
            throw new AppException.BadRequestException("Token does not belong to this user");
        }

        if (token.isUsed()) {
            throw new AppException.ConflictException("Token already used");
        }

        if (token.getExpiryDate() == null || token.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new AppException.BadRequestException("Token expired");
        }

        // mark used
        token.setUsed(true);
        token.setUsedAt(LocalDateTime.now());
        tokenRepo.save(token);

        // get reservation and update
        Reservation reservation = token.getReservation();
        if (reservation == null) {
            throw new AppException.BadRequestException("Token is not bound to a reservation");
        }

        reservation.setStatus("VERIFIED");
        reservationRepo.save(reservation);

        VerifyTokenResponse resp = VerifyTokenResponse.builder()
                .reservationId(reservation.getId())
                .userId(userId)
                .newStatus(reservation.getStatus())
                .build();

        return resp;
    }
}
