package com.nexcoffee.managementsystem.controllers;

import com.nexcoffee.managementsystem.dto.request.delivery.DeliverySettingRequest;
import com.nexcoffee.managementsystem.dto.response.delivery.DeliverySettingResponse;
import com.nexcoffee.managementsystem.services.DeliverySettingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/delivery-setting")
@RequiredArgsConstructor
public class AdminDeliverySettingController {

    private final DeliverySettingService deliverySettingService;

    @GetMapping
    public DeliverySettingResponse getSetting() {
        return deliverySettingService.getSetting();
    }

    @PutMapping
    public DeliverySettingResponse updateSetting(
            @Valid @RequestBody DeliverySettingRequest request
    ) {
        return deliverySettingService.updateSetting(request);
    }
}