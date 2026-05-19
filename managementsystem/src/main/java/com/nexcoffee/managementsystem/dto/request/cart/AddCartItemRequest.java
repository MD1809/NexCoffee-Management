package com.nexcoffee.managementsystem.dto.request.cart;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AddCartItemRequest {

    @NotNull(message = "Biến thể sản phẩm không được để trống")
    private Integer variantId;

    @Min(value = 1, message = "Số lượng phải lớn hơn 0")
    private Integer quantity = 1;
}