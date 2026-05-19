package com.nexcoffee.managementsystem.dto.response.cart;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CartItemResponse {

    private Long id;

    private Integer productId;
    private String productName;

    private Integer variantId;
    private String size;

    private Integer quantity;
    private Double unitPrice;
    private Double lineTotal;

    private String imageUrl;
}