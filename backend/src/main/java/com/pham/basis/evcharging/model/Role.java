    package com.pham.basis.evcharging.model;

    import com.fasterxml.jackson.annotation.JsonIgnore;
    import jakarta.persistence.*;
    import lombok.*;
    import java.util.ArrayList;
    import java.util.List;

    @Entity
    @Getter @Setter
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

        //FK
        @OneToMany(mappedBy = "role", fetch = FetchType.LAZY)
        private List<User> users = new ArrayList<>();
    }
