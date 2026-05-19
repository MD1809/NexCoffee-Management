package com.nexcoffee.managementsystem.dto.request;

import com.nexcoffee.managementsystem.enums.PaymentMethod;
import lombok.Data;

import java.util.List;

@Data
public class OrderRequest {
    private Long userId;
    private String fullName;
    private String phone;
    private String email;
    private String address;
    private String note;

    private Long shipping;
    private Long discount;
    private PaymentMethod paymentMethod;

    private List<OrderDetailRequest> items;

    @Data
    public static class OrderDetailRequest {
        private Integer productVariantId;
        private Integer quantity;
    }
}