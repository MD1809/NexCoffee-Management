package com.nexcoffee.managementsystem.dto.request.account;

import lombok.Data;

@Data
public class CancelOrderRequest {
    private String cancelReason;
}