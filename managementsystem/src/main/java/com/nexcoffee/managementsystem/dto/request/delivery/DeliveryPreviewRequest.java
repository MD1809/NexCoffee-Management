package com.nexcoffee.managementsystem.dto.request.delivery;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DeliveryPreviewRequest {

    private String formattedAddress;

    @NotNull(message = "Vĩ độ khách hàng không được để trống")
    private Double customerLatitude;

    @NotNull(message = "Kinh độ khách hàng không được để trống")
    private Double customerLongitude;

    private Long subtotal;
}