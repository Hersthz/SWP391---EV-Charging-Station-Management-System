package com.pham.basis.evcharging.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter @Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name= "users")
public class User{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    @Column(name = "full_name", length = 50)
    private String fullName;

    @Column(name = "username", length=50, nullable=false, unique=true)
    private String username;

    @Column(name = "password", length = 255, nullable=false)
    private String password;

    @Column(name = "email",length = 100,unique = true)
    private String email;

    @Column(name = "phone", length = 15, unique = true)
    private String phone;

    @Column(name = "status", nullable = false)
    private Boolean status = true;

    @Column(name = "is_verified", nullable = false)
    private Boolean isVerified = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt ;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    //FK
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @OneToOne(mappedBy = "manager")
    private ChargingStation managedStation;

    @OneToMany(mappedBy = "driver", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChargingSession> chargingSessions = new ArrayList<>();
}