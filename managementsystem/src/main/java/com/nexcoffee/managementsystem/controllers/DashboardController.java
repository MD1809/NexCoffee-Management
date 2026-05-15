package com.nexcoffee.managementsystem.controllers;

import com.nexcoffee.managementsystem.dto.response.DashboardOverviewResponse;
import com.nexcoffee.managementsystem.dto.response.RevenueByDayResponse;
import com.nexcoffee.managementsystem.dto.response.RevenueByMonthResponse;
import com.nexcoffee.managementsystem.dto.response.TopProductResponse;
import com.nexcoffee.managementsystem.services.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;


@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    // 1. API lấy 4 ô số liệu tổng quan (Doanh thu, Đơn hàng, Khách hàng, Sản phẩm đã bán)
    @GetMapping("/overview")
    public ResponseEntity<DashboardOverviewResponse> getOverview() {
        return ResponseEntity.ok(dashboardService.getOverviewData());
    }

    // 2. API lấy doanh thu 12 tháng theo năm (Mặc định nếu không truyền năm sẽ lấy năm 2026)
    @GetMapping("/revenue")
    public ResponseEntity<List<RevenueByMonthResponse>> getRevenueChart(@RequestParam(defaultValue = "2026") int year) {
        return ResponseEntity.ok(dashboardService.getRevenueChartData(year));
    }

    // 3. API lấy danh sách Top 5 sản phẩm bán chạy nhất
    @GetMapping("/top-products")
    public ResponseEntity<List<TopProductResponse>> getTopProducts() {
        return ResponseEntity.ok(dashboardService.getTopProducts());
    }

    // 4. API lấy doanh thu theo ngày của 1 tháng cụ thể
    @GetMapping("/revenue/daily")
    public ResponseEntity<List<RevenueByDayResponse>> getDailyRevenueChart(
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(dashboardService.getDailyRevenueChartData(year, month));
    }
}