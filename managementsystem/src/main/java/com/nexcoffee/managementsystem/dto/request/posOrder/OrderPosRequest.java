package com.nexcoffee.managementsystem.dto.request.posOrder;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class OrderPosRequest {

    @NotNull(message = "Tổng tiền tạm tính không được để trống")
    private Double subtotal;

    private Double discount;

    private Double shipping;

    @NotNull(message = "Tổng thanh toán cuối cùng không được để trống")
    private Double total;

    @NotNull(message = "Phương thức thanh toán không được để trống")
    private String paymentMethod;

    private Integer staffId;

    @NotEmpty(message = "Giỏ hàng không được để trống")
    private List<OrderItemPosRequest> items;
}