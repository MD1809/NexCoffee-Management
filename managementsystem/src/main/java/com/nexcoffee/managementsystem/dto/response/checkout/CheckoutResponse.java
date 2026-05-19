package com.nexcoffee.managementsystem.dto.response.checkout;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CheckoutResponse {

    private Integer orderId;
    private String orderCode;

    private Long subtotal;
    private Long shipping;
    private Long discount;
    private Long total;

    private String status;
    private String paymentMethod;
    private String paymentStatus;

    private List<CheckoutItemResponse> items;
}