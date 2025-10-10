    package com.pham.basis.evcharging.service;

    import com.pham.basis.evcharging.controller.AddStationRequest;
    import com.pham.basis.evcharging.dto.request.GetStationRequest;
    import com.pham.basis.evcharging.dto.request.StationFilterRequest;
    import com.pham.basis.evcharging.dto.response.AddStationResponse;
    import com.pham.basis.evcharging.dto.response.ChargingStationDetailResponse;
    import com.pham.basis.evcharging.dto.response.ChargingStationSummaryResponse;
    import com.pham.basis.evcharging.model.ChargerPillar;
    import com.pham.basis.evcharging.model.ChargingStation;
    import com.pham.basis.evcharging.model.Connector;
    import com.pham.basis.evcharging.model.StationReview;
    import com.pham.basis.evcharging.repository.ChargingStationRepository;
    import com.pham.basis.evcharging.repository.StationReviewRepository;
    import lombok.RequiredArgsConstructor;
    import org.springframework.stereotype.Service;
    import org.springframework.transaction.annotation.Transactional;

    import java.util.*;
    import java.util.function.Function;

    @Service
    @RequiredArgsConstructor
    public class ChargingStationServiceImpl implements ChargingStationService {

        private final ChargingStationRepository stationRepo;
        private final StationReviewRepository  stationReviewRepo;

        @Override
        @Transactional(readOnly = true)
        public List<ChargingStationSummaryResponse> getNearbyStations(StationFilterRequest req) {
            List<ChargingStation> stations = stationRepo.findAll();

            List<ChargingStation> filteredStations = stations.stream()
                    .peek(s -> s.setDistance(calculateDistance(req.getLatitude(), req.getLongitude(),
                            s.getLatitude(), s.getLongitude())))
                    .filter(s -> s.getDistance() != null && s.getDistance() <= req.getRadius())
                    .filter(s -> filterByConnectors(s, req.getConnectors()))
                    .filter(s -> filterByPower(s, req.getMinPower(), req.getMaxPower()))
                    .filter(s -> filterByPrice(s, req.getMinPrice(), req.getMaxPrice()))
                    .filter(s -> !req.getAvailableOnly() || hasAvailablePillar(s))
                    .sorted(getComparator(req.getSort()))
                    .toList();

            int startIndex = req.getPage() * req.getSize();
            int endIndex = Math.min(startIndex + req.getSize(), filteredStations.size());

            if (startIndex >= filteredStations.size()) {
                return List.of();
            }
            return filteredStations.subList(startIndex, endIndex).stream()
                    .map(this::convertToSummaryResponse)
                    .toList();
        }

        @Override
        @Transactional(readOnly = true)
        public ChargingStationDetailResponse getStationDetail(GetStationRequest request) {
            ChargingStation station = stationRepo.findById(request.getStationId())
                    .orElseThrow(() -> new RuntimeException("Station not found"));
            if (request.getLatitude() != null && request.getLongitude() != null &&
                    station.getLatitude() != null && station.getLongitude() != null) {

                Double distance = calculateDistance(
                        request.getLatitude(), request.getLongitude(),
                        station.getLatitude(), station.getLongitude()
                );
                station.setDistance(distance);
            }
            return convertToDetailResponse(station);
        }

        private ChargingStationSummaryResponse convertToSummaryResponse(ChargingStation s) {
            List<ChargerPillar> pillars = Optional.ofNullable(s.getPillars()).orElse(List.of());

            int total = pillars.size();
            int available = (int) pillars.stream()
                    .filter(p -> "Available".equalsIgnoreCase(p.getStatus()))
                    .count();

            List<String> connectorTypes = pillars.stream()
                    .flatMap(p -> Optional.ofNullable(p.getConnectors()).orElse(List.of()).stream())
                    .map(Connector::getType)
                    .filter(Objects::nonNull)
                    .distinct()
                    .toList();

            Double minPrice = pillars.stream().map(ChargerPillar::getPricePerKwh).filter(Objects::nonNull).min(Double::compareTo).orElse(null);
            Double maxPrice = pillars.stream().map(ChargerPillar::getPricePerKwh).filter(Objects::nonNull).max(Double::compareTo).orElse(null);
            Double minPower = pillars.stream().map(ChargerPillar::getPower).filter(Objects::nonNull).min(Double::compareTo).orElse(null);
            Double maxPower = pillars.stream().map(ChargerPillar::getPower).filter(Objects::nonNull).max(Double::compareTo).orElse(null);

            return new ChargingStationSummaryResponse(
                    s.getId(),
                    s.getName(),
                    s.getAddress(),
                    s.getLatitude(),
                    s.getLongitude(),
                    s.getDistance(),
                    available > 0 ? "Available" : "Occupied",
                    available,
                    total,
                    minPrice,
                    maxPrice,
                    minPower,
                    maxPower,
                    connectorTypes
            );
        }

        private ChargingStationDetailResponse convertToDetailResponse(ChargingStation s) {
            List<ChargingStationDetailResponse.PillarDto> pillarDtos = Optional.ofNullable(s.getPillars())
                    .orElse(List.of())
                    .stream()
                    .map(p -> new ChargingStationDetailResponse.PillarDto(
                            p.getCode(),
                            p.getStatus(),
                            p.getPower(),
                            p.getPricePerKwh(),
                            Optional.ofNullable(p.getConnectors()).orElse(List.of())
                                    .stream()
                                    .map(c -> new ChargingStationDetailResponse.ConnectorDto(c.getId(), c.getType()))
                                    .toList()
                    ))
                    .toList();

            List<ChargingStationDetailResponse.ReviewDto> reviewDtos = stationReviewRepo
                    .findByChargingStationIdOrderByCreatedAtDesc(s.getId())
                    .stream()
                    .map(this::convertToReviewDto)
                    .toList();

            return new ChargingStationDetailResponse(
                    s.getId(),
                    s.getName(),
                    s.getAddress(),
                    s.getLatitude(),
                    s.getLongitude(),
                    s.getDistance(),
                    s.getStatus(),
                    (int) pillarDtos.stream().filter(p -> "Available".equalsIgnoreCase(p.getStatus())).count(),
                    pillarDtos.size(),
                    getMin(pillarDtos, ChargingStationDetailResponse.PillarDto::getPricePerKwh),
                    getMax(pillarDtos, ChargingStationDetailResponse.PillarDto::getPricePerKwh),
                    getMin(pillarDtos, ChargingStationDetailResponse.PillarDto::getPower),
                    getMax(pillarDtos, ChargingStationDetailResponse.PillarDto::getPower),
                    pillarDtos,
                    reviewDtos
            );
        }
        private ChargingStationDetailResponse.ReviewDto convertToReviewDto(StationReview review) {
            String userName = review.getUser() != null
                    ? review.getUser().getFull_name()
                    : "Anonymous User";

            return new ChargingStationDetailResponse.ReviewDto(
                    review.getId().toString(),
                    userName,
                    review.getRating(),
                    review.getComment(),
                    review.getCreatedAt().toString()
            );
        }

        private <T extends Number> Double getMin(List<ChargingStationDetailResponse.PillarDto> list, Function<ChargingStationDetailResponse.PillarDto, T> fn) {
            return list.stream().map(fn).filter(Objects::nonNull).mapToDouble(Number::doubleValue).min().orElse(Double.NaN);
        }

        private <T extends Number> Double getMax(List<ChargingStationDetailResponse.PillarDto> list, Function<ChargingStationDetailResponse.PillarDto, T> fn) {
            return list.stream().map(fn).filter(Objects::nonNull).mapToDouble(Number::doubleValue).max().orElse(Double.NaN);
        }

        private boolean filterByConnectors(ChargingStation s, List<String> connectors) {
            if (connectors == null || connectors.isEmpty()) return true;
            return s.getPillars().stream()
                    .flatMap(p -> Optional.ofNullable(p.getConnectors()).orElse(List.of()).stream())
                    .map(Connector::getType)
                    .anyMatch(connectors::contains);
        }

        private boolean filterByPower(ChargingStation s, Double min, Double max) {
            return s.getPillars().stream().anyMatch(p ->
                    (min == null || p.getPower() >= min) &&
                            (max == null || p.getPower() <= max)
            );
        }

        private boolean filterByPrice(ChargingStation s, Double min, Double max) {
            return s.getPillars().stream().anyMatch(p ->
                    (min == null || p.getPricePerKwh() >= min) &&
                            (max == null || p.getPricePerKwh() <= max)
            );
        }

        private boolean hasAvailablePillar(ChargingStation s) {
            return s.getPillars().stream().anyMatch(p -> "Available".equalsIgnoreCase(p.getStatus()));
        }

        private Comparator<ChargingStation> getComparator(String sort) {
            return Comparator.comparingDouble(ChargingStation::getDistance);
        }

        private double getMinPrice(ChargingStation s) {
            return s.getPillars().stream()
                    .map(ChargerPillar::getPricePerKwh)
                    .filter(Objects::nonNull)
                    .min(Double::compareTo)
                    .orElse(Double.MAX_VALUE);
        }

        private double getMaxPower(ChargingStation s) {
            return s.getPillars().stream()
                    .map(ChargerPillar::getPower)
                    .filter(Objects::nonNull)
                    .max(Double::compareTo)
                    .orElse(Double.MIN_VALUE);
        }

        @Override
        public Double calculateDistance(Double lat1, Double lon1, Double lat2, Double lon2) {
            if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
                return null;
            }
            final int R = 6371;
            double latDistance = Math.toRadians(lat2 - lat1);
            double lonDistance = Math.toRadians(lon2 - lon1);
            double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                    + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                    * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
            double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            double distance = R * c;
            return Math.round(distance * 100.0) / 100.0;
        }

        @Override
        public AddStationResponse addStation(String userName, AddStationRequest request) {
            return null;
        }
    }