package com.nexcoffee.managementsystem.dto.response;

import com.nexcoffee.managementsystem.enums.ProductVariantStatus;
import lombok.Data;

@Data
public class ProductVariantResponse {
    private Integer id;
    private String size;
    private Double price;
    private ProductVariantStatus status;
}