package com.nexcoffee.managementsystem.controllers;

import com.nexcoffee.managementsystem.dto.request.delivery.DeliveryAreaRequest;
import com.nexcoffee.managementsystem.dto.response.delivery.DeliveryCheckResponse;
import com.nexcoffee.managementsystem.services.DeliveryAreaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import com.nexcoffee.managementsystem.dto.response.delivery.DeliveryAreaResponse;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class DeliveryAreaController {

    private final DeliveryAreaService deliveryAreaService;

    @GetMapping("/api/delivery-areas")
    public List<DeliveryAreaResponse> getAll(
            @RequestParam(required = false) String status
    ) {
        return deliveryAreaService.getAll(status);
    }

    @GetMapping("/api/delivery-areas/{id}")
    public DeliveryAreaResponse getById(@PathVariable Long id) {
        return deliveryAreaService.getById(id);
    }

    @PostMapping("/api/delivery-areas")
    public DeliveryAreaResponse create(
            @Valid @RequestBody DeliveryAreaRequest request
    ) {
        return deliveryAreaService.create(request);
    }

    @PutMapping("/api/delivery-areas/{id}")
    public DeliveryAreaResponse update(
            @PathVariable Long id,
            @Valid @RequestBody DeliveryAreaRequest request
    ) {
        return deliveryAreaService.update(id, request);
    }

    @PatchMapping("/api/delivery-areas/{id}/status")
    public DeliveryAreaResponse updateStatus(
            @PathVariable Long id,
            @RequestParam String status
    ) {
        return deliveryAreaService.updateStatus(id, status);
    }

    @DeleteMapping("/api/delivery-areas/{id}")
    public void delete(@PathVariable Long id) {
        deliveryAreaService.delete(id);
    }

    @GetMapping("/api/delivery/check")
    public DeliveryCheckResponse checkDelivery(
            @RequestParam String provinceCode,
            @RequestParam(required = false) String wardCode
    ) {
        return deliveryAreaService.checkDelivery(provinceCode, wardCode);
    }
}