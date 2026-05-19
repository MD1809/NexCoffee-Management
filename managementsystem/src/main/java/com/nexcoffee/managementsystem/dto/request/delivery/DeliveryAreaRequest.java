package com.nexcoffee.managementsystem.dto.request.delivery;

import com.nexcoffee.managementsystem.enums.DeliveryAreaStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DeliveryAreaRequest {

    @NotBlank(message = "Tỉnh/thành phố không được để trống")
    private String provinceCode;

    private String wardCode;

    @DecimalMin(value = "0.0", message = "Phí ship không được âm")
    private Double shippingFee = 0.0;

    private DeliveryAreaStatus status = DeliveryAreaStatus.ACTIVE;

    private String note;
}