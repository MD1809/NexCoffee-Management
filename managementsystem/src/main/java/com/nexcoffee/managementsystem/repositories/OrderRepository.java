package com.nexcoffee.managementsystem.repositories;

import com.nexcoffee.managementsystem.entities.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {
    List<Order> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}