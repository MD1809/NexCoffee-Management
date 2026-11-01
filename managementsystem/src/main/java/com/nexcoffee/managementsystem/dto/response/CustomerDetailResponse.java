package com.nexcoffee.managementsystem.dto.response;

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
public class CustomerDetailResponse {

    private UserInfo user;
    private CustomerStats stats;
    private List<CustomerOrderSummary> orders;
    private List<ProductReviewResponse> reviews;

    public UserInfo getUserInfo() {
        return this.user;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private Long id;
        private String fullName;
        private String email;
        private String phone;
        private String role;
        private String status;
        private boolean isVerified;
        private LocalDateTime createdAt;
        private String deactivationReason;
        private LocalDateTime deactivatedAt;
        private String deactivatedBy;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CustomerStats {
        private long totalOrders;
        private long completedOrders;
        private long cancelledOrders;
        private Long totalSpent;
        private long totalReviews;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CustomerOrderSummary {
        private Integer id;
        private String code;
        private LocalDateTime createdAt;
        private String status;
        private Long total;
        private String paymentMethod;
        private int itemCount;
        private String storeName;
    }
}
