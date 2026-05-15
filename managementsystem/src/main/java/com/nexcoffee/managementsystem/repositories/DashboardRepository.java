package com.nexcoffee.managementsystem.repositories;

import com.nexcoffee.managementsystem.entities.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DashboardRepository extends JpaRepository<Order, Integer> {

    // 1. Tính tổng doanh thu từ các đơn hàng đã hoàn thành (Status = 'Completed')
    @Query(value = "SELECT COALESCE(SUM(total), 0) FROM orders WHERE status = 'Completed'", nativeQuery = true)
    Long calculateTotalRevenue();

    // 2. Đếm tổng số lượng đơn hàng hệ thống đang có
    @Query(value = "SELECT COUNT(*) FROM orders", nativeQuery = true)
    Long countTotalOrders();

    // 3. Đếm tổng số khách hàng (role = 'customer') và đang ở trạng thái hoạt động (status = 'active')
    @Query(value = "SELECT COUNT(*) FROM users WHERE role = 'customer' AND status = 'active'", nativeQuery = true)
    Long countActiveCustomers();

    // 4. Tính tổng số lượng sản phẩm (ly nước) đã bán được thành công (từ các đơn 'Completed')
    @Query(value = "SELECT COALESCE(SUM(od.quantity), 0) FROM order_details od " +
            "JOIN orders o ON od.order_id = o.id " +
            "WHERE o.status = 'Completed'", nativeQuery = true)
    Long countTotalProductsSold();

    // 5. Thống kê doanh thu chi tiết theo từng tháng (từ tháng 1 đến tháng 12) của một năm cụ thể
    // Câu query sử dụng subquery tạo 12 tháng để đảm bảo tháng nào không có doanh thu vẫn hiển thị bằng 0
    @Query(value = "SELECT m.month, COALESCE(SUM(o.total), 0) as revenue " +
            "FROM (SELECT 1 as month UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 " +
            "      UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 " +
            "      UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12) m " +
            "LEFT JOIN orders o ON MONTH(o.created_at) = m.month " +
            "AND YEAR(o.created_at) = :year AND o.status = 'Completed' " +
            "GROUP BY m.month ORDER BY m.month", nativeQuery = true)
    List<Object[]> getMonthlyRevenueByYear(@Param("year") int year);

    // 6. Lấy danh sách Top 5 sản phẩm bán chạy nhất kèm tỉ lệ phần trăm doanh số
    @Query(value = "SELECT p.name, SUM(od.quantity) as qty, " +
            "ROUND((SUM(od.total_price) / (SELECT SUM(od2.total_price) FROM order_details od2 JOIN orders o2 ON od2.order_id = o2.id WHERE o2.status = 'Completed')) * 100, 2) as percentage, " +
            "p.image, p.status " +
            "FROM order_details od " +
            "JOIN orders o ON od.order_id = o.id " +
            "JOIN product_variants pv ON od.product_variant_id = pv.id " +
            "JOIN products p ON pv.product_id = p.id " +
            "WHERE o.status = 'Completed' " +
            "GROUP BY p.id, p.name, p.image, p.status " +
            "ORDER BY qty DESC LIMIT 5", nativeQuery = true)
    List<Object[]> findTopSellingProducts();

    // 7. Lấy doanh thu theo từng ngày trong một tháng cụ thể
    @Query(value = "SELECT DAY(created_at) as day, COALESCE(SUM(total), 0) as revenue " +
            "FROM orders " +
            "WHERE status = 'Completed' AND YEAR(created_at) = :year AND MONTH(created_at) = :month " +
            "GROUP BY DAY(created_at) ORDER BY day", nativeQuery = true)
    List<Object[]> getDailyRevenueByMonthAndYear(@Param("year") int year, @Param("month") int month);
}