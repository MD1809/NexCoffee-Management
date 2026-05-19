package com.nexcoffee.managementsystem.dto.response.delivery;

import com.nexcoffee.managementsystem.enums.DeliveryAreaStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class DeliveryAreaResponse {

    private Long id;

    private String areaKey;

    private String provinceCode;
    private String provinceName;

    private String wardCode;
    private String wardName;

    private String scopeLabel;

    private Double shippingFee;
    private DeliveryAreaStatus status;

    private String note;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}