    package com.pham.basis.evcharging.model;

    import com.fasterxml.jackson.annotation.JsonIgnore;
    import jakarta.persistence.*;
    import lombok.AllArgsConstructor;
    import lombok.Data;
    import lombok.NoArgsConstructor;
    import com.fasterxml.jackson.annotation.JsonIgnore;
    import java.util.ArrayList;
    import java.util.List;

    @Entity
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Table (name = "roles")
    public class Role {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        @Column(name = "role_id")
        private Integer id;

        @Column(name = "name")
        private String name;

        @Column(name = "description")
        private String description;

        @JsonIgnore
        @OneToMany(mappedBy = "role", fetch = FetchType.LAZY)
        private List<User> users = new ArrayList<>();
    }
