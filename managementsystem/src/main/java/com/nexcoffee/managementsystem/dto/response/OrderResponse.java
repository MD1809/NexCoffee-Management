package com.nexcoffee.managementsystem.dto.response;

import com.nexcoffee.managementsystem.enums.OrderStatus;
import com.nexcoffee.managementsystem.enums.PaymentMethod;
import com.nexcoffee.managementsystem.enums.PaymentStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class OrderResponse {
    private Integer id;
    private String staffName;
    private String shipperName;
    private String code;
    private String customerName;
    private String phone;
    private String address;

    private Long subtotal;
    private Long shipping;
    private Long discount;
    private Long total;

    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;

    private OrderStatus status;
    private String cancelReason;

    private LocalDateTime createdAt;

    private LocalDateTime processedAt;
    private LocalDateTime shippedAt;
    private LocalDateTime completedAt;

    private List<OrderDetailResponse> items;
}