package com.nexcoffee.managementsystem.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardOverviewResponse {
    private Long totalRevenue;
    private Long totalOrders;
    private Long totalCustomers;
    private Long productsSold;
}