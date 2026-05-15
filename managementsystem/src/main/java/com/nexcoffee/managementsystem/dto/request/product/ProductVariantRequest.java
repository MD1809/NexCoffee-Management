package com.nexcoffee.managementsystem.dto.request.product;

import com.nexcoffee.managementsystem.enums.ProductVariantStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class ProductVariantRequest {
    private Integer id;
    @NotNull(message = "Kích thước (size) không được để trống")
    private String size;
    @NotNull(message = "Giá không được để trống")
    @Positive(message = "Giá phải là số dương")
    private Double price;
    private ProductVariantStatus status;

}