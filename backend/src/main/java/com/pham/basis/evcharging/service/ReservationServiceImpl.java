package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.request.ReservationRequest;
import com.pham.basis.evcharging.dto.response.ReservationResponse;
import com.pham.basis.evcharging.exception.GlobalExceptionHandler.*;
import com.pham.basis.evcharging.model.*;
import com.pham.basis.evcharging.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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
                .orElseThrow(() -> new BadRequestException("User not found"));
        ChargingStation chargingStation = chargingStationRepository.findById(request.getStationId())
                .orElseThrow(() -> new BadRequestException("Station not found"));
        ChargerPillar chargerPillar = chargerPillarRepository.findChargerPillarById(request.getPillarId())
                .orElseThrow(() -> new BadRequestException("Pillar not found"));
        Connector connector = connectorRepository.findById(request.getConnectorId())
                .orElseThrow(() -> new BadRequestException("Connector not found"));
        // kieem tra có đúng pillar ko không ?
        if(!connector.getPillar().getId().equals(chargerPillar.getId())){
            throw new BadRequestException("Connector does not belong to the selected pillar");
        }
        //validate time
        validateTime(request);
        //kiểm tra chồng reservation
        checkForOverlappingReservations(request);


        LocalDateTime now = LocalDateTime.now();
        LocalDateTime endTime = request.getEndTime().plusMinutes(15);

        //tinhs holdFee 500d/p
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
                .expiredAt(endTime)
                .build();
        Reservation saved = reservationRepository.save(reservation);

        //trả về theo response
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

    private ReservationResponse toResponse(Reservation saved) {
        return ReservationResponse.builder()
                .reservationId(saved.getId())
                .stationId(saved.getStation().getId())
                .stationName(saved.getStation().getName())
                .pillarId(saved.getPillar().getId())
                .connectorId(saved.getConnector().getId())
                .status(saved.getStatus())
                .holdFee(saved.getHoldFee())
                .arrivalDate(saved.getArrivalDate())
                .startTime(saved.getStartTime())
                .endTime(saved.getEndTime())
                .createdAt(saved.getCreatedAt())
                .expiredAt(saved.getExpiredAt())
                .build();
    //
    private void validateTime(ReservationRequest req){
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = LocalDate.now();
        LocalDate maxDateAllowed = today.plusDays(7);

        //kiem tra end va start time
        if (!req.getEndTime().isAfter(req.getStartTime())) throw new BadRequestException("End time must be after start time");

            if (!req.getStartTime().isAfter(now)) throw new BadRequestException("Start time must be after current time");

        if (req.getStartTime().toLocalDate().isAfter(maxDateAllowed) ||
                req.getEndTime().toLocalDate().isAfter(maxDateAllowed)) {
            throw new BadRequestException("Reservations can only be made within 7 days from today");
        }

        // kiem tra min
        long durationMinutes = ChronoUnit.MINUTES.between(req.getStartTime(), req.getEndTime());

        if (durationMinutes < 15) {
            throw new BadRequestException("Minimum reservation time is 15 minutes");
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
            throw new BadRequestException(String.format(
                    "Pillar %d is already booked from %s to %s",
                    req.getPillarId(),
                    conflict.getStartTime(),
                    conflict.getEndTime()
            ));
        }
    }
}
