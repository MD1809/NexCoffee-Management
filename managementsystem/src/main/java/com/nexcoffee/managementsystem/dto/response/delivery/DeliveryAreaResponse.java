package com.nexcoffee.managementsystem.dto.response.delivery;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class DeliveryAreaResponse {

    private Long id;

    private String provinceCode;
    private String provinceName;

    private String wardCode;
    private String wardName;

    private String areaKey;
    private String scopeLabel;

    private Double shippingFee;
    private String status;
    private String note;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}