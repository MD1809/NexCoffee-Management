package com.nexcoffee.managementsystem.dto.request;

import com.nexcoffee.managementsystem.enums.OrderStatus;
import lombok.Data;

@Data
public class OrderStatusUpdateRequest {
    private Integer staffId;
    private Integer shipperId;
    private OrderStatus status;
    private String cancelReason;
}
