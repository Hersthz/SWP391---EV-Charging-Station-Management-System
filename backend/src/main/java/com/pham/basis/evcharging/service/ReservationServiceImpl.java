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
    public ReservationResponse createReservation(ReservationRequest request) {

        User user = userRepository.findById(request.getUserId()).orElseThrow(()->new RuntimeException("User not found"));

        ChargingStation chargingStation = chargingStationRepository.findById(request.getStationId()).orElseThrow(() -> new RuntimeException("Station not found"));

        ChargerPillar chargerPillar = chargerPillarRepository.findChargerPillarById(request.getPillarId()).orElseThrow(() -> new RuntimeException("Pillar not found"));

        Connector connector = connectorRepository.findById(request.getConnectorId()).orElseThrow(() -> new RuntimeException("Connector not found"));

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime endTime = now.plusMinutes(request.getArrivalEtaMinutes());

        BigDecimal holdFee = BigDecimal.valueOf(request.getArrivalEtaMinutes()).multiply(BigDecimal.valueOf(0.05));

        Reservation reservation = Reservation.builder()
                .user(user)
                .station(chargingStation)
                .pillar(chargerPillar)
                .connector(connector)
                .status("PENDING")
                .holdFee(holdFee)
                .createdAt(now)
                .expiredAt(endTime)
                .build();
        Reservation saved = reservationRepository.save(reservation);

        return ReservationResponse.builder()
                .reservationId(saved.getId())
                .stationId(saved.getStation().getId())
                .stationName(saved.getStation().getName())
                .pillarId(saved.getPillar().getId())
                .connectorId(saved.getConnector().getId())
                .status(saved.getStatus())
                .holdFee(saved.getHoldFee())
                .createdAt(saved.getCreatedAt())
                .expiredAt(saved.getExpiredAt())
                .build();
    }
}
