package com.pham.basis.evcharging.mapper;

import com.pham.basis.evcharging.dto.response.ChargingStationDetailResponse;
import com.pham.basis.evcharging.dto.response.ChargingStationSummaryResponse;
import com.pham.basis.evcharging.model.ChargingStation;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface StationMapper {

    @Mapping(target = "distance", source = "distance")
    @Mapping(target = "url", source = "station.url")
    @Mapping(target = "status", source = "station", qualifiedByName = "calculateStatus")
    @Mapping(target = "availableConnectors", source = "station", qualifiedByName = "calculateAvailableConnectors")
    @Mapping(target = "totalConnectors", source = "station", qualifiedByName = "calculateTotalConnectors")
    @Mapping(target = "minPrice", source = "station", qualifiedByName = "calculateMinPrice")
    @Mapping(target = "maxPrice", source = "station", qualifiedByName = "calculateMaxPrice")
    @Mapping(target = "minPower", source = "station", qualifiedByName = "calculateMinPower")
    @Mapping(target = "maxPower", source = "station", qualifiedByName = "calculateMaxPower")
    @Mapping(target = "connectorTypes", source = "station", qualifiedByName = "extractConnectorTypes")
    ChargingStationSummaryResponse toSummaryResponse(ChargingStation station);

    @Mapping(target = "distance", source = "distance")
    @Mapping(target = "url", source = "station.url")
    @Mapping(target = "status", source = "station", qualifiedByName = "calculateStatus")
    @Mapping(target = "availableConnectors", source = "station", qualifiedByName = "calculateAvailableConnectors")
    @Mapping(target = "totalConnectors", source = "station", qualifiedByName = "calculateTotalConnectors")
    @Mapping(target = "minPrice", source = "station", qualifiedByName = "calculateMinPrice")
    @Mapping(target = "maxPrice", source = "station", qualifiedByName = "calculateMaxPrice")
    @Mapping(target = "minPower", source = "station", qualifiedByName = "calculateMinPower")
    @Mapping(target = "maxPower", source = "station", qualifiedByName = "calculateMaxPower")
    ChargingStationDetailResponse toDetailResponse(ChargingStation station, Double distance);

    @Mapping(target = "distance", source = "distance")
    @Mapping(target = "url", source = "station.url")
    @Mapping(target = "status", source = "station", qualifiedByName = "calculateStatus")
    @Mapping(target = "availableConnectors", source = "station", qualifiedByName = "calculateAvailableConnectors")
    @Mapping(target = "totalConnectors", source = "station", qualifiedByName = "calculateTotalConnectors")
    @Mapping(target = "minPrice", source = "station", qualifiedByName = "calculateMinPrice")
    @Mapping(target = "maxPrice", source = "station", qualifiedByName = "calculateMaxPrice")
    @Mapping(target = "minPower", source = "station", qualifiedByName = "calculateMinPower")
    @Mapping(target = "maxPower", source = "station", qualifiedByName = "calculateMaxPower")
    ChargingStationDetailResponse toDetailResponse(ChargingStation station);

    // Named methods for complex mappings
    @Named("calculateStatus")
    default String calculateStatus(ChargingStation station) {
        return station.getPillars().stream()
                .flatMap(p -> Optional.ofNullable(p.getConnectors()).orElse(List.of()).stream())
                .anyMatch(c -> c.getStatus() != null && "AVAILABLE".equalsIgnoreCase(c.getStatus()))
                ? "Available" : "Occupied";
    }

    @Named("calculateAvailableConnectors")
    default Integer calculateAvailableConnectors(ChargingStation station) {
        return (int) station.getPillars().stream()
                .flatMap(p -> Optional.ofNullable(p.getConnectors()).orElse(List.of()).stream())
                .filter(c -> c.getStatus() != null && "AVAILABLE".equalsIgnoreCase(c.getStatus()))
                .count();
    }

    @Named("calculateTotalConnectors")
    default Integer calculateTotalConnectors(ChargingStation station) {
        return station.getPillars().stream()
                .mapToInt(p -> Optional.ofNullable(p.getConnectors()).orElse(List.of()).size())
                .sum();
    }

    @Named("calculateMinPrice")
    default Double calculateMinPrice(ChargingStation station) {
        return station.getPillars().stream()
                .map(p -> p.getPricePerKwh())
                .filter(price -> price != null)
                .min(Double::compareTo)
                .orElse(null);
    }

    @Named("calculateMaxPrice")
    default Double calculateMaxPrice(ChargingStation station) {
        if (station.getPillars() == null) return null;
        return station.getPillars().stream()
                .map(p -> p.getPricePerKwh())
                .filter(price -> price != null)
                .max(Double::compareTo)
                .orElse(null);
    }

    @Named("calculateMinPower")
    default Double calculateMinPower(ChargingStation station) {
        if (station.getPillars() == null) return null;
        return station.getPillars().stream()
                .map(p -> p.getPower())
                .filter(v -> v != null)
                .min(Double::compareTo)
                .orElse(null);
    }

    @Named("calculateMaxPower")
    default Double calculateMaxPower(ChargingStation station) {
        if (station.getPillars() == null) return null;
        return station.getPillars().stream()
                .map(p -> p.getPower())
                .filter(v -> v != null)
                .max(Double::compareTo)
                .orElse(null);
    }

    @Named("extractConnectorTypes")
    default List<String> extractConnectorTypes(ChargingStation station) {
        if (station.getPillars() == null) return List.of();
        return station.getPillars().stream()
                .flatMap(p -> Optional.ofNullable(p.getConnectors()).orElse(List.of()).stream())
                .map(c -> c.getType())
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
    }
    
}
