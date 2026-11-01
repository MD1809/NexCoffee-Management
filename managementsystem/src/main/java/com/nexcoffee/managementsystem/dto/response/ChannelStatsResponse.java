package com.nexcoffee.managementsystem.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChannelStatsResponse {
    private Long posRevenue;
    private Long posOrders;
    private Double posRevenuePercentage;

    private Long deliveryRevenue;
    private Long deliveryOrders;
    private Double deliveryRevenuePercentage;

    private Long totalRevenue;
    private Long totalOrders;
}
