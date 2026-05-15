package com.nexcoffee.managementsystem.entities;

import com.nexcoffee.managementsystem.enums.RoleUser;
import com.nexcoffee.managementsystem.enums.UserStatus;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data // Lombok tự động tạo Getter/Setter
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(name = "full_name")
    private String fullName;
    private String email;
    private String phone;
    private String password;

    @Enumerated(EnumType.STRING)
    private RoleUser role;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private UserStatus status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
