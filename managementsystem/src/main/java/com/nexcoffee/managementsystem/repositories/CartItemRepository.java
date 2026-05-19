package com.nexcoffee.managementsystem.repositories;

import com.nexcoffee.managementsystem.entities.Cart;
import com.nexcoffee.managementsystem.entities.CartItem;
import com.nexcoffee.managementsystem.entities.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    Optional<CartItem> findByCartAndProductVariant(Cart cart, ProductVariant productVariant);
}