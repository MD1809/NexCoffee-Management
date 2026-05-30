package com.nexcoffee.managementsystem.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.nexcoffee.managementsystem.dto.request.delivery.DeliveryPreviewRequest;
import com.nexcoffee.managementsystem.dto.response.delivery.DeliveryPreviewResponse;
import com.nexcoffee.managementsystem.entities.DeliverySetting;
import com.nexcoffee.managementsystem.entities.Store;
import com.nexcoffee.managementsystem.enums.StoreStatus;
import com.nexcoffee.managementsystem.repositories.DeliverySettingRepository;
import com.nexcoffee.managementsystem.repositories.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DeliveryPreviewService {

    private final DeliverySettingRepository deliverySettingRepository;
    private final StoreRepository storeRepository;
    private final TrackAsiaMapService trackAsiaMapService;

    public DeliveryPreviewResponse preview(DeliveryPreviewRequest request) {
        DeliverySetting setting = deliverySettingRepository.findFirstByOrderByIdAsc()
                .orElseThrow(() -> new RuntimeException("Chưa cấu hình giao hàng."));

        if (!Boolean.TRUE.equals(setting.getActive())) {
            return DeliveryPreviewResponse.builder()
                    .deliverable(false)
                    .message("NexCoffee hiện chưa hỗ trợ giao hàng.")
                    .build();
        }

        List<Store> activeStores = storeRepository.findByStatus(StoreStatus.ACTIVE);

        if (activeStores.isEmpty()) {
            return DeliveryPreviewResponse.builder()
                    .deliverable(false)
                    .message("Hiện chưa có quán nào hỗ trợ giao hàng.")
                    .build();
        }

        DistanceResult nearestDistance = findNearestStore(activeStores, request);

        int maxDistanceMeters = (int) Math.round(setting.getMaxDistanceKm() * 1000);

        if (nearestDistance.distanceMeters() > maxDistanceMeters) {
            return DeliveryPreviewResponse.builder()
                    .deliverable(false)
                    .distanceMeters(nearestDistance.distanceMeters())
                    .durationSeconds(nearestDistance.durationSeconds())
                    .maxDistanceKm(setting.getMaxDistanceKm())
                    .freeShipMinOrder(setting.getFreeShipMinOrder())
                    .shippingFee(setting.getShippingFee())
                    .finalShippingFee(null)
                    .nearestStoreId(nearestDistance.store().getId())
                    .nearestStoreName(nearestDistance.store().getName())
                    .nearestStoreAddress(nearestDistance.store().getAddress())
                    .message("Địa chỉ của bạn nằm ngoài phạm vi giao hàng "
                            + setting.getMaxDistanceKm()
                            + "km. Quán gần nhất là "
                            + nearestDistance.store().getName()
                            + ".")
                    .build();
        }

        long subtotal = request.getSubtotal() == null ? 0L : request.getSubtotal();

        long finalShippingFee = subtotal >= setting.getFreeShipMinOrder()
                ? 0L
                : setting.getShippingFee();

        return DeliveryPreviewResponse.builder()
                .deliverable(true)
                .distanceMeters(nearestDistance.distanceMeters())
                .durationSeconds(nearestDistance.durationSeconds())
                .maxDistanceKm(setting.getMaxDistanceKm())
                .freeShipMinOrder(setting.getFreeShipMinOrder())
                .shippingFee(setting.getShippingFee())
                .finalShippingFee(finalShippingFee)
                .nearestStoreId(nearestDistance.store().getId())
                .nearestStoreName(nearestDistance.store().getName())
                .nearestStoreAddress(nearestDistance.store().getAddress())
                .message(finalShippingFee == 0
                        ? "Đơn hàng đủ điều kiện miễn phí giao hàng."
                        : "Địa chỉ nằm trong phạm vi giao hàng.")
                .build();
    }

    private DistanceResult findNearestStore(
            List<Store> stores,
            DeliveryPreviewRequest request
    ) {
        return stores.stream()
                .map(store -> calculateDistance(store, request))
                .min(Comparator.comparingInt(DistanceResult::distanceMeters))
                .orElseThrow(() -> new RuntimeException("Không thể xác định quán gần nhất."));
    }

    private DistanceResult calculateDistance(
            Store store,
            DeliveryPreviewRequest request
    ) {
        try {
            JsonNode root = trackAsiaMapService.distanceMatrix(
                    store.getLatitude(),
                    store.getLongitude(),
                    request.getCustomerLatitude(),
                    request.getCustomerLongitude()
            );

            JsonNode distanceNode = root.path("distances").get(0).get(0);
            JsonNode durationNode = root.path("durations").get(0).get(0);

            if (distanceNode == null || distanceNode.isNull()) {
                throw new RuntimeException("Không thể tính khoảng cách giao hàng.");
            }

            int distanceMeters = (int) Math.round(distanceNode.asDouble());
            int durationSeconds = durationNode == null || durationNode.isNull()
                    ? 0
                    : (int) Math.round(durationNode.asDouble());

            return new DistanceResult(store, distanceMeters, durationSeconds);
        } catch (Exception exception) {
            throw new RuntimeException("Không thể tính khoảng cách giao hàng.");
        }
    }

    private record DistanceResult(
            Store store,
            int distanceMeters,
            int durationSeconds
    ) {}
}