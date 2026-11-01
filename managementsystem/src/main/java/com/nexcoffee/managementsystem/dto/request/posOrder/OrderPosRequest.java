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

    private String orderType; // DINE_IN hoặc TAKEAWAY

    private String tableNumber; // Số bàn hoặc Số thẻ rung mang về

    private Long cashGiven; // Tiền khách đưa

    private Long changeReturned; // Tiền thừa thối lại

    private String note; // Ghi chú đơn hàng

    @NotEmpty(message = "Giỏ hàng không được để trống")
    private List<OrderItemPosRequest> items;
}