package com.nexcoffee.managementsystem.services;

import com.nexcoffee.managementsystem.dto.request.delivery.DeliverySettingRequest;
import com.nexcoffee.managementsystem.dto.response.delivery.DeliverySettingResponse;
import com.nexcoffee.managementsystem.entities.DeliverySetting;
import com.nexcoffee.managementsystem.repositories.DeliverySettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class DeliverySettingService {

    private final DeliverySettingRepository deliverySettingRepository;

    @Transactional(readOnly = true)
    public DeliverySettingResponse getSetting() {
        DeliverySetting setting = deliverySettingRepository.findFirstByOrderByIdAsc()
                .orElseThrow(() -> new RuntimeException("Chưa cấu hình giao hàng."));

        return toResponse(setting);
    }

    public DeliverySettingResponse updateSetting(DeliverySettingRequest request) {
        DeliverySetting setting = deliverySettingRepository.findFirstByOrderByIdAsc()
                .orElseGet(DeliverySetting::new);

        setting.setMaxDistanceKm(request.getMaxDistanceKm());
        setting.setFreeShipMinOrder(request.getFreeShipMinOrder());
        setting.setShippingFee(request.getShippingFee());
        setting.setActive(request.getActive());

        DeliverySetting savedSetting = deliverySettingRepository.save(setting);

        return toResponse(savedSetting);
    }

    private DeliverySettingResponse toResponse(DeliverySetting setting) {
        return DeliverySettingResponse.builder()
                .id(setting.getId())
                .maxDistanceKm(setting.getMaxDistanceKm())
                .freeShipMinOrder(setting.getFreeShipMinOrder())
                .shippingFee(setting.getShippingFee())
                .active(setting.getActive())
                .createdAt(setting.getCreatedAt())
                .updatedAt(setting.getUpdatedAt())
                .build();
    }
}