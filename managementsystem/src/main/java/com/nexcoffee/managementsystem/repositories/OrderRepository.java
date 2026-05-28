package com.nexcoffee.managementsystem.repositories;

import com.nexcoffee.managementsystem.entities.Order;
import com.nexcoffee.managementsystem.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.nexcoffee.managementsystem.entities.User;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {
    List<Order> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    Optional<Order> findByCode(String code);

    @Query("SELECT SUM(o.total) FROM Order o WHERE o.createdAt BETWEEN :start AND :end AND o.paymentStatus = :paymentStatus")
    Long calculateRevenueByDate(@Param("start") LocalDateTime start,
                                @Param("end") LocalDateTime end,
                                @Param("paymentStatus") PaymentStatus paymentStatus);

    @Query("SELECT DISTINCT o FROM Order o " +
            "LEFT JOIN FETCH o.staff " +
            "LEFT JOIN FETCH o.shipper " +
            "WHERE o.createdAt >= :startOfDay AND o.createdAt <= :endOfDay")
    List<Order> findOrdersWithStaffAndShipperByDate(@Param("startOfDay") LocalDateTime startOfDay,
                                                    @Param("endOfDay") LocalDateTime endOfDay);
    List<Order> findByUserOrderByCreatedAtDesc(User user);

    Optional<Order> findByIdAndUser(Integer id, User user);
}