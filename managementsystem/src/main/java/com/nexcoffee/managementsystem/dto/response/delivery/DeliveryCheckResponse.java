package com.nexcoffee.managementsystem.dto.response.delivery;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DeliveryCheckResponse {

    private Boolean deliverable;
    private Double shippingFee;
    private String matchedLevel;
    private String message;

    public static DeliveryCheckResponse deliverable(
            Double shippingFee,
            String matchedLevel,
            String message
    ) {
        return DeliveryCheckResponse.builder()
                .deliverable(true)
                .shippingFee(shippingFee)
                .matchedLevel(matchedLevel)
                .message(message)
                .build();
    }

    public static DeliveryCheckResponse notDeliverable(String message) {
        return DeliveryCheckResponse.builder()
                .deliverable(false)
                .shippingFee(null)
                .matchedLevel(null)
                .message(message)
                .build();
    }
}