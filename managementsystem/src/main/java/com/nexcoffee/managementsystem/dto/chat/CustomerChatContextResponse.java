package com.nexcoffee.managementsystem.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerChatContextResponse {

    private Boolean isMember;
    private Long userId;
    private String customerName;
    private String phone;
    private String email;
    private String avatar;
    private String handoverReason;
    private Long totalSpent;
    private Integer orderCount;
    private LocalDateTime memberSince;
    private List<RecentOrderItemDto> recentOrders;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentOrderItemDto {
        private Integer orderId;
        private String orderCode;
        private String status;
        private String statusText;
        private Long totalAmount;
        private String totalFormatted;
        private LocalDateTime createdAt;
        private String itemsSummary;
    }
}
