package com.nexcoffee.managementsystem.dto.response.delivery;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DeliveryPreviewResponse {

    private Boolean deliverable;

    private Integer distanceMeters;
    private Integer durationSeconds;

    private Double maxDistanceKm;

    private Long freeShipMinOrder;
    private Long shippingFee;
    private Long finalShippingFee;

    private Long nearestStoreId;
    private String nearestStoreName;
    private String nearestStoreAddress;

    private String message;
}