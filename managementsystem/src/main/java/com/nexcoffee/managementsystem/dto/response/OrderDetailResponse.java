package com.nexcoffee.managementsystem.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OrderDetailResponse {
    private Integer id;
    private String image;
    private String productName;
    private String size;
    private Integer quantity;
    private Long unitPrice;
    private Long totalPrice;
}