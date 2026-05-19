package com.nexcoffee.managementsystem.repositories;

import com.nexcoffee.managementsystem.entities.Cart;
import com.nexcoffee.managementsystem.entities.User;
import com.nexcoffee.managementsystem.enums.CartStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, Long> {

    Optional<Cart> findByCartTokenAndStatus(String cartToken, CartStatus status);

    Optional<Cart> findByUserAndStatus(User user, CartStatus status);
}