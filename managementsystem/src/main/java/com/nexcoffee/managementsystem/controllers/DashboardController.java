package com.nexcoffee.managementsystem.controllers;

import com.nexcoffee.managementsystem.dto.response.*;
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

    @GetMapping("/overview")
    public ResponseEntity<DashboardOverviewResponse> getOverview(@RequestParam(required = false) Long storeId) {
        return ResponseEntity.ok(dashboardService.getOverviewData(storeId));
    }

    @GetMapping("/revenue")
    public ResponseEntity<List<RevenueByMonthResponse>> getRevenueChart(
            @RequestParam(defaultValue = "2026") int year,
            @RequestParam(required = false) Long storeId) {
        return ResponseEntity.ok(dashboardService.getRevenueChartData(year, storeId));
    }

    @GetMapping("/top-products")
    public ResponseEntity<List<TopProductResponse>> getTopProducts(@RequestParam(required = false) Long storeId) {
        return ResponseEntity.ok(dashboardService.getTopProducts(storeId));
    }

    @GetMapping("/revenue/daily")
    public ResponseEntity<List<RevenueByDayResponse>> getDailyRevenueChart(
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam(required = false) Long storeId) {
        return ResponseEntity.ok(dashboardService.getDailyRevenueChartData(year, month, storeId));
    }

    @GetMapping("/channel-stats")
    public ResponseEntity<ChannelStatsResponse> getChannelStats(
            @RequestParam(defaultValue = "2026") int year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Long storeId) {
        return ResponseEntity.ok(dashboardService.getChannelStats(year, month, storeId));
    }

    @GetMapping("/store-comparison")
    public ResponseEntity<List<StoreComparisonResponse>> getStoreComparison(
            @RequestParam(defaultValue = "2026") int year,
            @RequestParam(required = false) Integer month) {
        return ResponseEntity.ok(dashboardService.getStoreComparison(year, month));
    }
}