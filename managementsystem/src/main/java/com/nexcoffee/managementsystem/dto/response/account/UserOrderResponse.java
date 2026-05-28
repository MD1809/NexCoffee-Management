package com.nexcoffee.managementsystem.dto.response.account;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class UserOrderResponse {

    private Integer id;
    private String code;

    private String fullName;
    private String phone;
    private String email;
    private String address;

    private Long subtotal;
    private Long shipping;
    private Long discount;
    private Long total;

    private String paymentMethod;
    private String paymentStatus;
    private String status;

    private String note;
    private String cancelReason;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<UserOrderItemResponse> items;
}