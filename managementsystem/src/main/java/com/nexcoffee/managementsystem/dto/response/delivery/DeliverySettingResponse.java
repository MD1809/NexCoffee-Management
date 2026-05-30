package com.nexcoffee.managementsystem.dto.response.delivery;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class DeliverySettingResponse {

    private Long id;

    private Double maxDistanceKm;
    private Long freeShipMinOrder;
    private Long shippingFee;
    private Boolean active;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}