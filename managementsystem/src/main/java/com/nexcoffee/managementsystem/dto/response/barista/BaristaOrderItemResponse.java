package com.nexcoffee.managementsystem.dto.response.barista;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BaristaOrderItemResponse {
    private Integer id;
    private String productName;
    private String variantSize;
    private Integer quantity;
    private Long unitPrice;
    private Long totalPrice;
    private String imageUrl;
}
