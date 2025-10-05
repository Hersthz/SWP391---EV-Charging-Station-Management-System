package com.pham.basis.evcharging.service;

import com.pham.basis.evcharging.dto.request.ReservationRequest;
import com.pham.basis.evcharging.dto.response.ReservationResponse;
import com.pham.basis.evcharging.model.*;
import com.pham.basis.evcharging.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;


@Service
@RequiredArgsConstructor
public class ReservationServiceImpl implements ReservationService {
    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final ChargingStationRepository chargingStationRepository;
    private final ChargerPillarRepository chargerPillarRepository;
    private final ConnectorRepository connectorRepository;
    @Override
    public ReservationResponse createReservation(ReservationRequest reservationRequest) {
        User user = userRepository.findById(reservationRequest.getUserId()).orElseThrow(() -> new RuntimeException("User not found"));
        ChargingStation chargingStation = chargingStationRepository.findChargingStationById(reservationRequest.getStationId()).orElseThrow(() -> new RuntimeException("Station not found"));
        ChargerPillar chargerPillar = chargerPillarRepository.findChargerPillarById(reservationRequest.getPillarId()).orElseThrow(() -> new RuntimeException("Pillar not found"));
        Connector connector = connectorRepository.findById(reservationRequest.getConnectorId()).orElseThrow(() -> new RuntimeException("Connector not found"));

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime endTime = now.plusMinutes(reservationRequest.getDurationMinutes());

        BigDecimal holdFee = BigDecimal.valueOf(reservationRequest.getDurationMinutes() * 0.05);

        Reservation reservation = Reservation.builder()
                .user(user)
                .station(chargingStation)
                .pillar(chargerPillar)
                .connector(connector)
                .startTime(now)
                .endTime(endTime)
                .status("PENDING")
                .holdFee(holdFee)
                .createdAt(LocalDateTime.now())
                .build();
        Reservation saved = reservationRepository.save(reservation);

        return ReservationResponse.builder()
                .reservationId(saved.getId())
                .userId(user.getId())
                .stationId(chargingStation.getId())
                .stationName(chargingStation.getName())
                .pillarId(chargerPillar.getId())
                .pillarCode(chargerPillar.getCode())
                .connectorId(connector.getId())
                .connectorType(connector.getType())
                .startTime(saved.getStartTime())
                .endTime(saved.getEndTime())
                .status(saved.getStatus())
                .holdFee(saved.getHoldFee())
                .createdAt(saved.getCreatedAt())
                .build();
    }
}
