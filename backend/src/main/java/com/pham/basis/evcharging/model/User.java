package com.pham.basis.evcharging.model;

import jakarta.persistence.*;

@Entity
// @Entity: Đánh dấu class này là bảng trong database (JPA sẽ quản lý mapping)
@Table(name = "users")   // map đến đúng bảng có sẵn trong DB
public class User {
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    // Tự động tăng (SQL Server hỗ trợ)
    private int user_id;
    private String username;
    private String password;
    private String email;
    private String role_id;

    public User(int user_id, String username, String password, String email, String role_id) {
        this.user_id = user_id;
        this.username = username;
        this.password = password;
        this.email = email;
        this.role_id = role_id;
    }

    public User() {
    }

    public int getUser_id() {
        return user_id;
    }

    public void setUser_id(int user_id) {
        this.user_id = user_id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole_id() {
        return role_id;
    }

    public void setRole_id(String role_id) {
        this.role_id = role_id;
    }
}
