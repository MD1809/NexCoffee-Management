package com.nexcoffee.managementsystem.repositories;

import com.nexcoffee.managementsystem.entities.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DashboardRepository extends JpaRepository<Order, Integer> {

    // 1. Tính tổng doanh thu từ các đơn hàng đã hoàn thành (Status = 'Completed'), hỗ trợ lọc storeId
    @Query(value = "SELECT COALESCE(SUM(total), 0) FROM orders " +
            "WHERE status = 'Completed' AND (:storeId IS NULL OR nearest_store_id = :storeId)", nativeQuery = true)
    Long calculateTotalRevenue(@Param("storeId") Long storeId);

    // 2. Đếm tổng số lượng đơn hàng hệ thống đang có, hỗ trợ lọc storeId
    @Query(value = "SELECT COUNT(*) FROM orders " +
            "WHERE (:storeId IS NULL OR nearest_store_id = :storeId)", nativeQuery = true)
    Long countTotalOrders(@Param("storeId") Long storeId);

    // 3. Đếm số khách hàng hoạt động (toàn hệ thống hoặc đã từng mua tại cửa hàng)
    @Query(value = "SELECT COUNT(DISTINCT CASE WHEN :storeId IS NULL THEN u.id ELSE o.user_id END) " +
            "FROM users u " +
            "LEFT JOIN orders o ON u.id = o.user_id AND o.nearest_store_id = :storeId " +
            "WHERE u.role = 'CUSTOMER' AND u.status = 'ACTIVE' " +
            "AND (:storeId IS NULL OR o.user_id IS NOT NULL)", nativeQuery = true)
    Long countActiveCustomers(@Param("storeId") Long storeId);

    // 4. Đếm tổng số lượng sản phẩm đang hoạt động
    @Query(value = "SELECT COUNT(*) FROM products WHERE status = 'active' AND deleted = false", nativeQuery = true)
    Long countActiveProducts();

    // 5. Thống kê doanh thu chi tiết 12 tháng theo năm và storeId
    @Query(value = "SELECT m.month, COALESCE(SUM(o.total), 0) as revenue " +
            "FROM (SELECT 1 as month UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 " +
            "      UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 " +
            "      UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12) m " +
            "LEFT JOIN orders o ON MONTH(o.created_at) = m.month " +
            "AND YEAR(o.created_at) = :year AND o.status = 'Completed' " +
            "AND (:storeId IS NULL OR o.nearest_store_id = :storeId) " +
            "GROUP BY m.month ORDER BY m.month", nativeQuery = true)
    List<Object[]> getMonthlyRevenueByYear(@Param("year") int year, @Param("storeId") Long storeId);

    // 6. Top 5 sản phẩm bán chạy nhất kèm tỉ lệ phần trăm, hỗ trợ lọc storeId
    @Query(value = "SELECT p.name, SUM(od.quantity) as qty, " +
            "ROUND((SUM(od.total_price) / NULLIF((SELECT SUM(od2.total_price) FROM order_details od2 JOIN orders o2 ON od2.order_id = o2.id WHERE o2.status = 'Completed' AND (:storeId IS NULL OR o2.nearest_store_id = :storeId)), 0)) * 100, 2) as percentage, " +
            "pi.image_url as image, p.status " +
            "FROM order_details od " +
            "JOIN orders o ON od.order_id = o.id " +
            "JOIN product_variants pv ON od.product_variant_id = pv.id " +
            "JOIN products p ON pv.product_id = p.id " +
            "LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_main = TRUE " +
            "WHERE o.status = 'Completed' AND (:storeId IS NULL OR o.nearest_store_id = :storeId) " +
            "GROUP BY p.id, p.name, pi.image_url, p.status " +
            "ORDER BY qty DESC LIMIT 5", nativeQuery = true)
    List<Object[]> findTopSellingProducts(@Param("storeId") Long storeId);

    // 7. Lấy doanh thu theo từng ngày trong một tháng cụ thể, hỗ trợ lọc storeId
    @Query(value = "SELECT DAY(created_at) as day, COALESCE(SUM(total), 0) as revenue " +
            "FROM orders " +
            "WHERE status = 'Completed' AND YEAR(created_at) = :year AND MONTH(created_at) = :month " +
            "AND (:storeId IS NULL OR nearest_store_id = :storeId) " +
            "GROUP BY DAY(created_at) ORDER BY day", nativeQuery = true)
    List<Object[]> getDailyRevenueByMonthAndYear(@Param("year") int year, @Param("month") int month, @Param("storeId") Long storeId);

    // 8. Thống kê cơ cấu kênh bán hàng: POS (tại quầy) vs Web Delivery (giao hàng online)
    @Query(value = "SELECT " +
            "COALESCE(SUM(CASE WHEN (o.user_id IS NULL OR o.address IS NULL OR TRIM(o.address) = '') THEN o.total ELSE 0 END), 0) as posRevenue, " +
            "COALESCE(SUM(CASE WHEN (o.user_id IS NULL OR o.address IS NULL OR TRIM(o.address) = '') THEN 1 ELSE 0 END), 0) as posOrders, " +
            "COALESCE(SUM(CASE WHEN (o.user_id IS NOT NULL AND o.address IS NOT NULL AND TRIM(o.address) != '') THEN o.total ELSE 0 END), 0) as deliveryRevenue, " +
            "COALESCE(SUM(CASE WHEN (o.user_id IS NOT NULL AND o.address IS NOT NULL AND TRIM(o.address) != '') THEN 1 ELSE 0 END), 0) as deliveryOrders " +
            "FROM orders o " +
            "WHERE o.status = 'Completed' " +
            "AND YEAR(o.created_at) = :year " +
            "AND (:month IS NULL OR MONTH(o.created_at) = :month) " +
            "AND (:storeId IS NULL OR o.nearest_store_id = :storeId)", nativeQuery = true)
    List<Object[]> getChannelStats(@Param("year") int year, @Param("month") Integer month, @Param("storeId") Long storeId);

    // 9. So sánh xếp hạng hiệu quả giữa tất cả các chi nhánh (Dành riêng cho Super Admin)
    @Query(value = "SELECT s.id, s.name, s.address, " +
            "COALESCE(SUM(o.total), 0) as revenue, " +
            "COUNT(o.id) as ordersCount " +
            "FROM stores s " +
            "LEFT JOIN orders o ON s.id = o.nearest_store_id " +
            "  AND o.status = 'Completed' " +
            "  AND YEAR(o.created_at) = :year " +
            "  AND (:month IS NULL OR MONTH(o.created_at) = :month) " +
            "WHERE s.status = 'ACTIVE' " +
            "GROUP BY s.id, s.name, s.address " +
            "ORDER BY revenue DESC", nativeQuery = true)
    List<Object[]> getStoreComparison(@Param("year") int year, @Param("month") Integer month);
}