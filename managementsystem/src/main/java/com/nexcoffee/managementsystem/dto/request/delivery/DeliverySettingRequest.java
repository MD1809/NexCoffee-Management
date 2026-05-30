package com.nexcoffee.managementsystem.dto.request.delivery;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DeliverySettingRequest {

    @NotNull(message = "Khoảng cách giao hàng tối đa không được để trống")
    @DecimalMin(value = "0.1", message = "Khoảng cách giao hàng phải lớn hơn 0")
    private Double maxDistanceKm;

    @NotNull(message = "Mức đơn miễn phí ship không được để trống")
    @Min(value = 0, message = "Mức đơn miễn phí ship không được âm")
    private Long freeShipMinOrder;

    @NotNull(message = "Phí ship không được để trống")
    @Min(value = 0, message = "Phí ship không được âm")
    private Long shippingFee;

    @NotNull(message = "Trạng thái giao hàng không được để trống")
    private Boolean active;
}