package com.nexcoffee.managementsystem.dto.response.account;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserOrderItemResponse {

    private Integer productId;
    private String productName;

    private Integer variantId;
    private String size;

    private Integer quantity;
    private Long unitPrice;
    private Long totalPrice;
    private Long lineTotal;

    private String image;
}