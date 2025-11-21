package com.pham.basis.evcharging.seeder;

import com.pham.basis.evcharging.config.PasswordEncoderConfig;
import com.pham.basis.evcharging.model.Role;
import com.pham.basis.evcharging.model.User;
import com.pham.basis.evcharging.repository.RoleRepository;
import com.pham.basis.evcharging.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoderConfig passwordEncoder;

    @Override
    public void run(String... args) {
        seedRole("USER", "Normal EV Driver");
        seedRole("STAFF", "Station Staff");
        seedRole("ADMIN", "System Administrator");

        seedAdmin();
    }

    private void seedRole(String name, String desc) {
        if (roleRepository.findByName(name).isEmpty()) {
            Role role = new Role();
            role.setName(name);
            role.setDescription(desc);
            roleRepository.save(role);
        }
    }

    private void seedAdmin() {
        String email = "admin@system.com";

        if (userRepository.existsByEmail(email)) return;

        Role adminRole = roleRepository.findByName("ADMIN").orElseThrow();

        User admin = new User();
        admin.setEmail(email);
        admin.setUsername("admin@system.com");
        admin.setFullName("System Administrator");
        admin.setPassword(passwordEncoder.passwordEncoder().encode("admin123"));
        admin.setRole(adminRole);
        admin.setPhone("0355911666");
        admin.setCreatedAt(LocalDateTime.now());
        admin.setIsVerified(true);

        userRepository.save(admin);
    }
}

