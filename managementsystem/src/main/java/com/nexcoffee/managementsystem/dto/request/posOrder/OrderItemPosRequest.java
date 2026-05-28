package com.nexcoffee.managementsystem.dto.request.posOrder;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrderItemPosRequest {

    @NotNull(message = "ID biến thể sản phẩm không được để trống")
    private Integer productVariantId;

    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 1, message = "Số lượng phải lớn hơn 0")
    private Integer quantity;

    @NotNull(message = "Đơn giá không được để trống")
    private Double unitPrice;
}
