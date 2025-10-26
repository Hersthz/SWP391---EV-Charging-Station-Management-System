package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.request.ReservationRequest;
import com.pham.basis.evcharging.dto.response.ReservationResponse;
import com.pham.basis.evcharging.exception.AppException;
import com.pham.basis.evcharging.exception.GlobalExceptionHandler.*;
import com.pham.basis.evcharging.model.*;
import com.pham.basis.evcharging.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class ReservationServiceImpl implements ReservationService {
    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final ChargingStationRepository chargingStationRepository;
    private final ChargerPillarRepository chargerPillarRepository;
    private final ConnectorRepository connectorRepository;
    @Override
    public ReservationResponse createReservation(ReservationRequest request) {

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new AppException.BadRequestException("User not found"));
        ChargingStation chargingStation = chargingStationRepository.findById(request.getStationId())
                .orElseThrow(() -> new AppException.BadRequestException("Station not found"));
        ChargerPillar chargerPillar = chargerPillarRepository.findChargerPillarById(request.getPillarId())
                .orElseThrow(() -> new AppException.BadRequestException("Pillar not found"));
        Connector connector = connectorRepository.findById(request.getConnectorId())
                .orElseThrow(() -> new AppException.BadRequestException("Connector not found"));
        // kieem tra có đúng pillar ko không ?
        if(!connector.getPillar().getId().equals(chargerPillar.getId())){
            throw new AppException.BadRequestException("Connector does not belong to the selected pillar");
        }
        //validate time
        validateTime(request);

        //kiểm tra chồng reservation
        checkForOverlappingReservations(request);


        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiredAt = request.getEndTime().plusMinutes(15);

        //tinhs holdFee 300d/p
        long minutes = ChronoUnit.MINUTES.between(request.getStartTime(), request.getEndTime());
        BigDecimal holdFee = BigDecimal.valueOf(minutes).multiply(BigDecimal.valueOf(300));

        //lưu db với status pending
        Reservation reservation = Reservation.builder()
                .user(user)
                .station(chargingStation)
                .pillar(chargerPillar)
                .connector(connector)
                .status("PENDING")
                .holdFee(holdFee)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .createdAt(now)
                .expiredAt(expiredAt)
                .build();
        Reservation saved = reservationRepository.save(reservation);

        //trả về theo response
        return toResponse(saved);
    }

    @Override
    public List<ReservationResponse> getReservationsByUser(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Reservation> reservations = reservationRepository
                .findByUserIdOrderByCreatedAtDesc(userId);

        return reservations.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ReservationResponse updateStatus(Long reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new AppException.BadRequestException("Reservation not found"));
        reservation.setStatus("PLUGGED");
        Reservation saved = reservationRepository.save(reservation);
        return toResponse(saved);
    }

    private ReservationResponse toResponse(Reservation saved) {
        return ReservationResponse.builder()
                .reservationId(saved.getId())
                .stationId(saved.getStation().getId())
                .stationName(saved.getStation().getName())
                .pillarId(saved.getPillar().getId())
                .connectorId(saved.getConnector().getId())
                .status(saved.getStatus())
                .holdFee(saved.getHoldFee())
                .startTime(saved.getStartTime())
                .endTime(saved.getEndTime())
                .createdAt(saved.getCreatedAt())
                .expiredAt(saved.getExpiredAt())
                .build();
    }

    private void validateTime(ReservationRequest req){
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = LocalDate.now();
        LocalDate maxDateAllowed = today.plusDays(7);

        //kiem tra end va start time
        if (!req.getEndTime().isAfter(req.getStartTime())) throw new AppException.BadRequestException("End time must be after start time");

            if (!req.getStartTime().isAfter(now)) throw new AppException.BadRequestException("Start time must be after current time");

        if (req.getStartTime().toLocalDate().isAfter(maxDateAllowed) ||
                req.getEndTime().toLocalDate().isAfter(maxDateAllowed)) {
            throw new AppException.BadRequestException("Reservations can only be made within 7 days from today");
        }

        // kiem tra min
        long durationMinutes = ChronoUnit.MINUTES.between(req.getStartTime(), req.getEndTime());

        if (durationMinutes < 15) {
            throw new AppException.BadRequestException("Minimum reservation time is 15 minutes");
        }
    }

    private void checkForOverlappingReservations(ReservationRequest req) {
        List<Reservation> existingReservations = reservationRepository
                .findOverlappingReservations(
                        req.getPillarId(),
                        req.getStartTime(),
                        req.getEndTime().plusMinutes(15)
                );

        if (!existingReservations.isEmpty()) {
            Reservation conflict = existingReservations.get(0);
            throw new AppException.BadRequestException(String.format(
                    "Pillar %d is already booked from %s to %s",
                    req.getPillarId(),
                    conflict.getStartTime(),
                    conflict.getEndTime()
            ));
        }
    }

    @Transactional
    @Scheduled(fixedRate = 60000)
    public void autoUpdatePillarStatus() {
        LocalDateTime now = LocalDateTime.now();
        List<Reservation> reservations = reservationRepository.findByStatusAndStartTimeBefore("SCHEDULED",now);
        for (Reservation r : reservations) {
            r.setStatus("VERIFYING");
            reservationRepository.save(r);

            ChargerPillar p = r.getPillar();
            p.setStatus("OCCUPIED");
            chargerPillarRepository.save(p);
        }

        List<Reservation> ended = reservationRepository.findByStatusAndEndTimeBefore("CHARGING", now);
        for (Reservation r : ended) {
            r.setStatus("COMPLETED");
            reservationRepository.save(r);

            ChargerPillar pillar = r.getPillar();
            pillar.setStatus("AVAILABLE");
            chargerPillarRepository.save(pillar);
        }
    }


}
