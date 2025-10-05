package com.pham.basis.evcharging.seeder;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pham.basis.evcharging.model.ChargerPillar;
import com.pham.basis.evcharging.model.ChargingStation;
import com.pham.basis.evcharging.model.Connector;
import com.pham.basis.evcharging.repository.ChargingStationRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.List;

@Component
public class SeedStations implements CommandLineRunner {

    private final ChargingStationRepository stationRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public SeedStations(ChargingStationRepository stationRepository) {
        this.stationRepository = stationRepository;
    }

    @Override
    public void run(String... args) {
        try {
            long count = stationRepository.count();
            System.out.println("Stations in DB: " + count);
            if (count > 0) {
                System.out.println("DB already has data — skipping seeding.");
                return;
            }

            ClassPathResource resource = new ClassPathResource("data/stations.json");
            if (!resource.exists()) {
                System.err.println("Seed file not found: src/main/resources/data/stations.json");
                return;
            }

            try (InputStream is = resource.getInputStream()) {
                List<ChargingStation> stations = objectMapper.readValue(is, new TypeReference<List<ChargingStation>>() {});
                System.out.println("Loaded stations from JSON: " + stations.size());

                // Fix references & clear IDs to let JPA generate them
                for (ChargingStation s : stations) {
                    // Null out id (in case JSON had it) to avoid identity issues
                    try {
                        s.setId(null);
                    } catch (Exception ignored) {}

                    if (s.getPillars() != null) {
                        for (ChargerPillar p : s.getPillars()) {
                            p.setId(null);
                            p.setStation(s); // back-ref
                            if (p.getConnectors() != null) {
                                for (Connector c : p.getConnectors()) {
                                    c.setId(null);
                                    c.setPillar(p); // back-ref
                                }
                            }
                        }
                    }
                }

                stationRepository.saveAll(stations);
                System.out.println("Seeding completed: inserted " + stations.size() + " stations.");
            }
        } catch (Exception e) {
            System.err.println("Error during seeding:");
            e.printStackTrace();
        }
    }
}
