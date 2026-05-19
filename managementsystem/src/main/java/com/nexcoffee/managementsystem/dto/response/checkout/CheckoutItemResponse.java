package com.nexcoffee.managementsystem.dto.response.checkout;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CheckoutItemResponse {

    private Integer productId;
    private String productName;

    private Integer variantId;
    private String size;

    private Integer quantity;
    private Long unitPrice;
    private Long totalPrice;
}