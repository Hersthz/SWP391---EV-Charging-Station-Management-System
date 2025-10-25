package com.pham.basis.evcharging.seeder;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pham.basis.evcharging.model.Role;
import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.model.Vehicle;
import com.pham.basis.evcharging.repository.UserRepository;
import com.pham.basis.evcharging.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.Collections;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class SeedVehicles implements CommandLineRunner {

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final Random random = new Random();

    @Override
    public void run(String... args) {
        try {
            long count = vehicleRepository.count();
            System.out.println("Vehicles in DB: " + count);
            if (count > 0) {
                System.out.println("DB already has vehicles — skipping seeding.");
                return;
            }

            // Đọc file JSON
            ClassPathResource resource = new ClassPathResource("data/vehicles.json");
            if (!resource.exists()) {
                System.err.println("Seed file not found: src/main/resources/data/vehicles.json");
                return;
            }

            List<Vehicle> vehicleTemplates;
            try (InputStream is = resource.getInputStream()) {
                vehicleTemplates = objectMapper.readValue(is, new TypeReference<List<Vehicle>>() {});
                System.out.println("Loaded " + vehicleTemplates.size() + " vehicle templates from JSON");
            }

            // Lấy tất cả user có role "User"
            List<User> normalUsers = userRepository.findAll().stream()
                    .filter(u -> {
                        Role r = u.getRole();
                        return r != null && r.getName().equalsIgnoreCase("USER");
                    })
                    .collect(Collectors.toList());

            if (normalUsers.isEmpty()) {
                System.err.println("No users with role 'USER' found — skipping vehicle seeding.");
                return;
            }

            System.out.println("Found " + normalUsers.size() + " normal users — assigning vehicles...");

            int totalInserted = 0;

            for (User u : normalUsers) {
                int numVehicles = 1 + random.nextInt(3); // 1–3 xe
                Collections.shuffle(vehicleTemplates);

                List<Vehicle> assigned = vehicleTemplates.stream()
                        .limit(numVehicles)
                        .map(template -> {
                            Vehicle v = new Vehicle();
                            v.setUser(u);
                            v.setMake(template.getMake());
                            v.setModel(template.getModel());
                            v.setSocNow(template.getSocNow());
                            v.setBatteryCapacityKwh(template.getBatteryCapacityKwh());
                            v.setAcMaxKw(template.getAcMaxKw());
                            v.setDcMaxKw(template.getDcMaxKw());
                            v.setEfficiency(template.getEfficiency());
                            return v;
                        })
                        .collect(Collectors.toList());

                vehicleRepository.saveAll(assigned);
                totalInserted += assigned.size();
            }

            System.out.println("Vehicle seeding completed: inserted total " + totalInserted + " vehicles.");

        } catch (Exception e) {
            System.err.println("Error during vehicle seeding:");
            e.printStackTrace();
        }
    }
}
