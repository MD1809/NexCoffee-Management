package com.nexcoffee.managementsystem.repositories;

import com.nexcoffee.managementsystem.entities.Order;
import com.nexcoffee.managementsystem.enums.OrderStatus;
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
    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Order> findByPhoneOrderByCreatedAtDesc(String phone);

    Optional<Order> findByIdAndUser(Integer id, User user);

    List<Order> findByNearestStoreIdOrderByCreatedAtDesc(Long nearestStoreId);

    List<Order> findByNearestStoreIdAndCreatedAtBetweenOrderByCreatedAtDesc(
            Long nearestStoreId,
            LocalDateTime start,
            LocalDateTime end
    );

    Optional<Order> findByIdAndNearestStoreId(Integer id, Long nearestStoreId);

    List<Order> findAllByOrderByCreatedAtDesc();

    List<Order> findByCreatedAtBetweenOrderByCreatedAtDesc(
            LocalDateTime start,
            LocalDateTime end
    );
    @Query("SELECT SUM(o.total) FROM Order o " +
            "WHERE o.createdAt BETWEEN :start AND :end " +
            "AND o.paymentStatus = :paymentStatus " +
            "AND o.nearestStoreId = :storeId")
    Long calculateRevenueByDateAndStoreId(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("paymentStatus") PaymentStatus paymentStatus,
            @Param("storeId") Long storeId
    );

    @Query("SELECT DISTINCT o FROM Order o " +
            "LEFT JOIN FETCH o.staff " +
            "LEFT JOIN FETCH o.shipper " +
            "WHERE o.createdAt >= :startOfDay " +
            "AND o.createdAt <= :endOfDay " +
            "AND o.nearestStoreId = :storeId")
    List<Order> findOrdersWithStaffAndShipperByDateAndStoreId(
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("endOfDay") LocalDateTime endOfDay,
            @Param("storeId") Long storeId
    );

    @Query("SELECT DISTINCT o FROM Order o " +
            "LEFT JOIN FETCH o.orderDetails od " +
            "LEFT JOIN FETCH od.productVariant pv " +
            "LEFT JOIN FETCH pv.product p " +
            "LEFT JOIN FETCH o.staff " +
            "WHERE o.status = :status ORDER BY o.createdAt ASC")
    List<Order> findByStatusOrderByCreatedAtAsc(@Param("status") com.nexcoffee.managementsystem.enums.OrderStatus status);

    @Query("SELECT DISTINCT o FROM Order o " +
            "LEFT JOIN FETCH o.orderDetails od " +
            "LEFT JOIN FETCH od.productVariant pv " +
            "LEFT JOIN FETCH pv.product p " +
            "LEFT JOIN FETCH o.staff " +
            "WHERE o.nearestStoreId = :nearestStoreId AND o.status = :status ORDER BY o.createdAt ASC")
    List<Order> findByNearestStoreIdAndStatusOrderByCreatedAtAsc(
            @Param("nearestStoreId") Long nearestStoreId,
            @Param("status") com.nexcoffee.managementsystem.enums.OrderStatus status
    );

    @Query("SELECT o.staff.id, COUNT(o) FROM Order o " +
            "WHERE o.nearestStoreId = :storeId " +
            "AND o.staff IS NOT NULL " +
            "AND (o.code LIKE 'NEX-%' OR o.address IS NULL) " +
            "AND o.createdAt >= :start AND o.createdAt <= :end " +
            "AND o.status <> com.nexcoffee.managementsystem.enums.OrderStatus.Cancelled " +
            "GROUP BY o.staff.id")
    List<Object[]> countPosOrdersByStaffGrouped(
            @Param("storeId") Long storeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("SELECT o.staff.id, COUNT(o) FROM Order o " +
            "WHERE o.nearestStoreId = :storeId " +
            "AND o.staff IS NOT NULL " +
            "AND (o.code NOT LIKE 'NEX-%' AND o.address IS NOT NULL) " +
            "AND o.createdAt >= :start AND o.createdAt <= :end " +
            "AND o.status <> com.nexcoffee.managementsystem.enums.OrderStatus.Cancelled " +
            "GROUP BY o.staff.id")
    List<Object[]> countOnlineOrdersByStaffGrouped(
            @Param("storeId") Long storeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("SELECT o.barista.id, COUNT(o) FROM Order o " +
            "WHERE o.nearestStoreId = :storeId " +
            "AND o.barista IS NOT NULL " +
            "AND ((o.completedAt IS NOT NULL AND o.completedAt >= :start AND o.completedAt <= :end) " +
            "     OR (o.completedAt IS NULL AND o.createdAt >= :start AND o.createdAt <= :end)) " +
            "AND o.status <> com.nexcoffee.managementsystem.enums.OrderStatus.Cancelled " +
            "GROUP BY o.barista.id")
    List<Object[]> countBaristaOrdersGrouped(
            @Param("storeId") Long storeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("SELECT o.shipper.id, COUNT(o) FROM Order o " +
            "WHERE o.nearestStoreId = :storeId " +
            "AND o.shipper IS NOT NULL " +
            "AND o.createdAt >= :start AND o.createdAt <= :end " +
            "AND (o.status = com.nexcoffee.managementsystem.enums.OrderStatus.Completed " +
            "     OR o.status = com.nexcoffee.managementsystem.enums.OrderStatus.Shipped) " +
            "GROUP BY o.shipper.id")
    List<Object[]> countShipperOrdersGrouped(
            @Param("storeId") Long storeId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("SELECT o FROM Order o " +
            "WHERE o.nearestStoreId = :storeId " +
            "AND (o.staff.id = :userId OR (o.barista IS NOT NULL AND o.barista.id = :userId) OR (o.shipper IS NOT NULL AND o.shipper.id = :userId)) " +
            "ORDER BY o.createdAt DESC")
    List<Order> findRecentOrdersByStaffMember(
            @Param("storeId") Long storeId,
            @Param("userId") Long userId,
            org.springframework.data.domain.Pageable pageable
    );
}