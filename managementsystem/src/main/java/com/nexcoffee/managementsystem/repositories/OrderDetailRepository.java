package com.nexcoffee.managementsystem.repositories;

import com.nexcoffee.managementsystem.entities.OrderDetail;
import com.nexcoffee.managementsystem.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderDetailRepository extends JpaRepository<OrderDetail, Integer> {

    // BỔ SUNG: Interface Projection để hứng dữ liệu thống kê món
    interface ProductSaleStats {
        String getProductName();
        String getSize();
        Long getTotalQuantity();
    }

    @Query("SELECT p.name AS productName, pv.size AS size, SUM(od.quantity) AS totalQuantity " +
            "FROM OrderDetail od " +
            "JOIN od.order o " +
            "JOIN od.productVariant pv " +
            "JOIN pv.product p " +
            "WHERE o.createdAt >= :startOfDay AND o.createdAt <= :endOfDay " +
            "AND o.status = :targetStatus " +
            "GROUP BY p.name, pv.size " +
            "ORDER BY totalQuantity DESC")
    List<ProductSaleStats> getProductSalesByDate(@Param("startOfDay") LocalDateTime startOfDay,
                                                 @Param("endOfDay") LocalDateTime endOfDay,
                                                 @Param("targetStatus") OrderStatus targetStatus);
}