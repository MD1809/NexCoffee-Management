package com.nexcoffee.managementsystem.repositories;

import com.nexcoffee.managementsystem.entities.User;
import com.nexcoffee.managementsystem.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Optional<User> findByPhone(String phone);

    Optional<User> findByVerificationToken(String token);

    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);

    List<User> findByRoleAndStatus(Role role, String status);
}