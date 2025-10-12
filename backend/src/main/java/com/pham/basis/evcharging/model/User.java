package com.pham.basis.evcharging.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name= "users")
public class User{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    @Column(name = "full_name",columnDefinition = "NVarchar(50)")
    private String full_name;

    @Column(name = "username", length=50, nullable=false, unique=true)
    private String username;

    @JsonIgnore
    @Column(name = "password", length = 255, nullable=false)
    private String password;

    @Column(name = "email",length = 100,unique = true)
    private String email;

    @Column(name = "phone", length = 15, unique = true)
    private String phone;

    @Column(name = "status", nullable = false)
    private Boolean status = true;

    @Column(name = "is_verified", nullable = false)
    private Boolean is_verified = false;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Column(name = "created_at")
    private LocalDateTime created_at ;

    @Column(name = "date_of_birth")
    private LocalDate date_of_birth;

    @OneToOne(mappedBy = "manager")
    @JsonIgnore
    private ChargingStation managedStation;
}