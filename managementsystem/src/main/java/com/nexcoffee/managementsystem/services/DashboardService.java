package com.nexcoffee.managementsystem.services;

import com.nexcoffee.managementsystem.dto.response.DashboardOverviewResponse;
import com.nexcoffee.managementsystem.dto.response.RevenueByDayResponse;
import com.nexcoffee.managementsystem.dto.response.RevenueByMonthResponse;
import com.nexcoffee.managementsystem.dto.response.TopProductResponse;
import com.nexcoffee.managementsystem.repositories.DashboardRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    @Autowired
    private DashboardRepository dashboardRepository;

    // 1. Lấy dữ liệu 4 ô số liệu tổng quan
    public DashboardOverviewResponse getOverviewData() {
        Long totalRevenue = dashboardRepository.calculateTotalRevenue();
        Long totalOrders = dashboardRepository.countTotalOrders();
        Long totalCustomers = dashboardRepository.countActiveCustomers();
        Long totalProducts = dashboardRepository.countActiveProducts();

        return new DashboardOverviewResponse(totalRevenue, totalOrders, totalCustomers, totalProducts);
    }

    // 2. Lấy doanh thu 12 tháng theo năm
    public List<RevenueByMonthResponse> getRevenueChartData(int year) {
        List<Object[]> results = dashboardRepository.getMonthlyRevenueByYear(year);
        List<RevenueByMonthResponse> chartData = new ArrayList<>();

        for (Object[] row : results) {
            int month = ((Number) row[0]).intValue();
            Long revenue = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            chartData.add(new RevenueByMonthResponse(month, revenue));
        }
        return chartData;
    }

    // 3. Lấy danh sách Top 5 sản phẩm bán chạy nhất
    public List<TopProductResponse> getTopProducts() {
        List<Object[]> results = dashboardRepository.findTopSellingProducts();
        List<TopProductResponse> topProducts = new ArrayList<>();

        for (Object[] row : results) {
            String name = (String) row[0];
            Long qty = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            Double percentage = row[2] != null ? ((Number) row[2]).doubleValue() : 0.0;
            String image = (String) row[3];
            String status = (String) row[4];

            // Map đầy đủ 5 tham số
            topProducts.add(new TopProductResponse(name, qty, percentage, image, status));
        }
        return topProducts;
    }

    // 4. Lấy doanh thu 31 ngày trong tháng
    public List<RevenueByDayResponse> getDailyRevenueChartData(int year, int month) {
        List<Object[]> results = dashboardRepository.getDailyRevenueByMonthAndYear(year, month);

        // Chuyển kết quả từ Database sang dạng Map<Ngày, DoanhThu> để dễ tra cứu
        Map<Integer, Long> revenueMap = new HashMap<>();
        for (Object[] row : results) {
            int day = ((Number) row[0]).intValue();
            Long revenue = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            revenueMap.put(day, revenue);
        }

        // Dùng java.time để tính chính xác số ngày của tháng đó trong năm đó (xử lý cả năm nhuận)
        YearMonth yearMonthObject = YearMonth.of(year, month);
        int daysInMonth = yearMonthObject.lengthOfMonth();

        List<RevenueByDayResponse> chartData = new ArrayList<>();

        // Lặp từ ngày 1 đến ngày cuối cùng của tháng, ngày nào ko có data thì set doanh thu = 0
        for (int i = 1; i <= daysInMonth; i++) {
            chartData.add(new RevenueByDayResponse(i, revenueMap.getOrDefault(i, 0L)));
        }

        return chartData;
    }
}