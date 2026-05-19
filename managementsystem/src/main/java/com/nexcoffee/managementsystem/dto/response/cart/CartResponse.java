package com.nexcoffee.managementsystem.dto.response.cart;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CartResponse {

    private Long id;
    private String cartToken;

    private List<CartItemResponse> items;

    private Integer totalQuantity;
    private Double totalAmount;
}