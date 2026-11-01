package com.nexcoffee.managementsystem.services;

import com.nexcoffee.managementsystem.dto.response.*;
import com.nexcoffee.managementsystem.entities.User;
import com.nexcoffee.managementsystem.enums.Role;
import com.nexcoffee.managementsystem.repositories.DashboardRepository;
import com.nexcoffee.managementsystem.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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

    @Autowired
    private UserRepository userRepository;

    /**
     * Xác định storeId thực tế dựa trên vai trò của người dùng hiện tại:
     * - SUPER_ADMIN: được phép chọn storeId (nếu null/0 -> toàn hệ thống).
     * - ADMIN: bắt buộc lấy storeId từ Store mà user đó quản lý (bảo mật tuyệt đối ở Service layer).
     */
    private Long resolveEffectiveStoreId(Long requestedStoreId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return (requestedStoreId != null && requestedStoreId > 0) ? requestedStoreId : null;
        }

        String email = auth.getName();
        if (email == null || email.isBlank() || "anonymousUser".equals(email)) {
            return (requestedStoreId != null && requestedStoreId > 0) ? requestedStoreId : null;
        }

        User currentUser = userRepository.findByEmail(email).orElse(null);
        if (currentUser == null) {
            return (requestedStoreId != null && requestedStoreId > 0) ? requestedStoreId : null;
        }

        if (currentUser.getRole() == Role.ADMIN) {
            if (currentUser.getStore() != null) {
                return currentUser.getStore().getId();
            }
            return -1L; // User không gán quán nào -> không thấy đơn của quán khác
        }

        // Với SUPER_ADMIN
        return (requestedStoreId != null && requestedStoreId > 0) ? requestedStoreId : null;
    }

    private boolean isSuperAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return false;
        String email = auth.getName();
        return userRepository.findByEmail(email)
                .map(u -> u.getRole() == Role.SUPER_ADMIN)
                .orElse(false);
    }

    // 1. Lấy dữ liệu 4 ô số liệu tổng quan
    public DashboardOverviewResponse getOverviewData(Long storeId) {
        Long effectiveStoreId = resolveEffectiveStoreId(storeId);

        Long totalRevenue = dashboardRepository.calculateTotalRevenue(effectiveStoreId);
        Long totalOrders = dashboardRepository.countTotalOrders(effectiveStoreId);
        Long totalCustomers = dashboardRepository.countActiveCustomers(effectiveStoreId);
        Long totalProducts = dashboardRepository.countActiveProducts();

        return new DashboardOverviewResponse(totalRevenue, totalOrders, totalCustomers, totalProducts);
    }

    // 2. Lấy doanh thu 12 tháng theo năm
    public List<RevenueByMonthResponse> getRevenueChartData(int year, Long storeId) {
        Long effectiveStoreId = resolveEffectiveStoreId(storeId);
        List<Object[]> results = dashboardRepository.getMonthlyRevenueByYear(year, effectiveStoreId);
        List<RevenueByMonthResponse> chartData = new ArrayList<>();

        for (Object[] row : results) {
            int month = ((Number) row[0]).intValue();
            Long revenue = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            chartData.add(new RevenueByMonthResponse(month, revenue));
        }
        return chartData;
    }

    // 3. Lấy danh sách Top 5 sản phẩm bán chạy nhất
    public List<TopProductResponse> getTopProducts(Long storeId) {
        Long effectiveStoreId = resolveEffectiveStoreId(storeId);
        List<Object[]> results = dashboardRepository.findTopSellingProducts(effectiveStoreId);
        List<TopProductResponse> topProducts = new ArrayList<>();

        for (Object[] row : results) {
            String name = (String) row[0];
            Long qty = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            Double percentage = row[2] != null ? ((Number) row[2]).doubleValue() : 0.0;
            String image = (String) row[3];
            String status = (String) row[4];

            topProducts.add(new TopProductResponse(name, qty, percentage, image, status));
        }
        return topProducts;
    }

    // 4. Lấy doanh thu 31 ngày trong tháng
    public List<RevenueByDayResponse> getDailyRevenueChartData(int year, int month, Long storeId) {
        Long effectiveStoreId = resolveEffectiveStoreId(storeId);
        List<Object[]> results = dashboardRepository.getDailyRevenueByMonthAndYear(year, month, effectiveStoreId);

        Map<Integer, Long> revenueMap = new HashMap<>();
        for (Object[] row : results) {
            int day = ((Number) row[0]).intValue();
            Long revenue = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            revenueMap.put(day, revenue);
        }

        YearMonth yearMonthObject = YearMonth.of(year, month);
        int daysInMonth = yearMonthObject.lengthOfMonth();

        List<RevenueByDayResponse> chartData = new ArrayList<>();
        for (int i = 1; i <= daysInMonth; i++) {
            chartData.add(new RevenueByDayResponse(i, revenueMap.getOrDefault(i, 0L)));
        }

        return chartData;
    }

    // 5. Thống kê cơ cấu kênh bán: POS (tại quầy) vs Web Delivery
    public ChannelStatsResponse getChannelStats(int year, Integer month, Long storeId) {
        Long effectiveStoreId = resolveEffectiveStoreId(storeId);
        List<Object[]> results = dashboardRepository.getChannelStats(year, month, effectiveStoreId);

        if (results == null || results.isEmpty()) {
            return ChannelStatsResponse.builder()
                    .posRevenue(0L).posOrders(0L).posRevenuePercentage(0.0)
                    .deliveryRevenue(0L).deliveryOrders(0L).deliveryRevenuePercentage(0.0)
                    .totalRevenue(0L).totalOrders(0L)
                    .build();
        }

        Object[] row = results.get(0);
        Long posRevenue = row[0] != null ? ((Number) row[0]).longValue() : 0L;
        Long posOrders = row[1] != null ? ((Number) row[1]).longValue() : 0L;
        Long deliveryRevenue = row[2] != null ? ((Number) row[2]).longValue() : 0L;
        Long deliveryOrders = row[3] != null ? ((Number) row[3]).longValue() : 0L;

        Long totalRevenue = posRevenue + deliveryRevenue;
        Long totalOrders = posOrders + deliveryOrders;

        Double posShare = totalRevenue > 0 ? Math.round(((double) posRevenue / totalRevenue * 100) * 100.0) / 100.0 : 0.0;
        Double deliveryShare = totalRevenue > 0 ? Math.round(((double) deliveryRevenue / totalRevenue * 100) * 100.0) / 100.0 : 0.0;

        return ChannelStatsResponse.builder()
                .posRevenue(posRevenue)
                .posOrders(posOrders)
                .posRevenuePercentage(posShare)
                .deliveryRevenue(deliveryRevenue)
                .deliveryOrders(deliveryOrders)
                .deliveryRevenuePercentage(deliveryShare)
                .totalRevenue(totalRevenue)
                .totalOrders(totalOrders)
                .build();
    }

    // 6. So sánh hiệu quả giữa các chi nhánh (Dành riêng cho Super Admin)
    public List<StoreComparisonResponse> getStoreComparison(int year, Integer month) {
        if (!isSuperAdmin()) {
            return List.of();
        }

        List<Object[]> results = dashboardRepository.getStoreComparison(year, month);
        List<StoreComparisonResponse> list = new ArrayList<>();

        long grandTotalRevenue = 0L;
        for (Object[] row : results) {
            Long rev = row[3] != null ? ((Number) row[3]).longValue() : 0L;
            grandTotalRevenue += rev;
        }

        for (Object[] row : results) {
            Long storeId = ((Number) row[0]).longValue();
            String storeName = (String) row[1];
            String address = (String) row[2];
            Long rev = row[3] != null ? ((Number) row[3]).longValue() : 0L;
            Long orders = row[4] != null ? ((Number) row[4]).longValue() : 0L;

            Double share = grandTotalRevenue > 0
                    ? Math.round(((double) rev / grandTotalRevenue * 100) * 100.0) / 100.0
                    : 0.0;

            list.add(StoreComparisonResponse.builder()
                    .storeId(storeId)
                    .storeName(storeName)
                    .address(address)
                    .revenue(rev)
                    .ordersCount(orders)
                    .sharePercentage(share)
                    .build());
        }

        return list;
    }
}