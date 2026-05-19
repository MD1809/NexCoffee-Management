package com.nexcoffee.managementsystem.services;

import com.nexcoffee.managementsystem.dto.request.delivery.DeliveryAreaRequest;
import com.nexcoffee.managementsystem.dto.response.delivery.DeliveryAreaResponse;
import com.nexcoffee.managementsystem.dto.response.delivery.DeliveryCheckResponse;
import com.nexcoffee.managementsystem.entities.DeliveryArea;
import com.nexcoffee.managementsystem.enums.DeliveryAreaStatus;
import com.nexcoffee.managementsystem.repositories.DeliveryAreaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.nexcoffee.managementsystem.entities.Province;
import com.nexcoffee.managementsystem.entities.Ward;
import com.nexcoffee.managementsystem.repositories.ProvinceRepository;
import com.nexcoffee.managementsystem.repositories.WardRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class DeliveryAreaService {

    private final DeliveryAreaRepository deliveryAreaRepository;
    private final ProvinceRepository provinceRepository;
    private final WardRepository wardRepository;

    @Transactional(readOnly = true)
    public List<DeliveryAreaResponse> getAll(String status) {
        List<DeliveryArea> areas;

        if (status != null && !status.isBlank()) {
            DeliveryAreaStatus areaStatus = DeliveryAreaStatus.valueOf(status.toUpperCase());
            areas = deliveryAreaRepository.findByStatus(areaStatus);
        } else {
            areas = deliveryAreaRepository.findAll();
        }

        return areas.stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public DeliveryAreaResponse getById(Long id) {
        DeliveryArea area = deliveryAreaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khu vực giao hàng."));

        return toResponse(area);
    }

    public DeliveryAreaResponse create(DeliveryAreaRequest request) {
        validateLocation(request.getProvinceCode(), request.getWardCode());

        String areaKey = buildAreaKey(request.getProvinceCode(), request.getWardCode());

        if (deliveryAreaRepository.existsByAreaKey(areaKey)) {
            throw new RuntimeException("Khu vực giao hàng này đã được cấu hình.");
        }

        DeliveryArea area = DeliveryArea.builder()
                .areaKey(areaKey)
                .provinceCode(request.getProvinceCode())
                .wardCode(normalizeBlank(request.getWardCode()))
                .shippingFee(request.getShippingFee() == null ? 0.0 : request.getShippingFee())
                .status(request.getStatus() == null ? DeliveryAreaStatus.ACTIVE : request.getStatus())
                .note(request.getNote())
                .build();

        return toResponse(deliveryAreaRepository.save(area));
    }

    public DeliveryAreaResponse update(Long id, DeliveryAreaRequest request) {
        DeliveryArea area = deliveryAreaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khu vực giao hàng."));

        area.setShippingFee(request.getShippingFee() == null ? 0.0 : request.getShippingFee());
        area.setStatus(request.getStatus() == null ? DeliveryAreaStatus.ACTIVE : request.getStatus());
        area.setNote(request.getNote());

        return toResponse(deliveryAreaRepository.save(area));
    }

    public DeliveryAreaResponse updateStatus(Long id, String status) {
        DeliveryArea area = deliveryAreaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khu vực giao hàng."));

        area.setStatus(DeliveryAreaStatus.valueOf(status.toUpperCase()));

        return toResponse(deliveryAreaRepository.save(area));
    }

    public void delete(Long id) {
        if (!deliveryAreaRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy khu vực giao hàng.");
        }

        deliveryAreaRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public DeliveryCheckResponse checkDelivery(String provinceCode, String wardCode) {
        if (provinceCode == null || provinceCode.isBlank()) {
            return DeliveryCheckResponse.notDeliverable("Vui lòng chọn tỉnh/thành phố.");
        }

        String normalizedWardCode = normalizeBlank(wardCode);

        if (normalizedWardCode != null) {
            String wardKey = "WARD:" + normalizedWardCode;

            DeliveryArea wardRule = deliveryAreaRepository.findByAreaKey(wardKey)
                    .orElse(null);

            if (wardRule != null) {
                if (wardRule.getStatus() == DeliveryAreaStatus.ACTIVE) {
                    return DeliveryCheckResponse.deliverable(
                            wardRule.getShippingFee(),
                            "WARD",
                            "Khu vực này được hỗ trợ giao hàng."
                    );
                }

                return DeliveryCheckResponse.notDeliverable(
                        "Khu vực này hiện đang tạm ngừng giao hàng."
                );
            }
        }

        String provinceKey = "PROVINCE:" + provinceCode;

        DeliveryArea provinceRule = deliveryAreaRepository.findByAreaKey(provinceKey)
                .orElse(null);

        if (provinceRule != null) {
            if (provinceRule.getStatus() == DeliveryAreaStatus.ACTIVE) {
                return DeliveryCheckResponse.deliverable(
                        provinceRule.getShippingFee(),
                        "PROVINCE",
                        "Khu vực này được hỗ trợ giao hàng."
                );
            }

            return DeliveryCheckResponse.notDeliverable(
                    "Tỉnh/thành này hiện đang tạm ngừng giao hàng."
            );
        }

        return DeliveryCheckResponse.notDeliverable(
                "NexCoffee hiện chưa hỗ trợ giao hàng tại khu vực này."
        );
    }

    private void validateLocation(String provinceCode, String wardCode) {
        if (provinceCode == null || provinceCode.isBlank()) {
            throw new RuntimeException("Vui lòng chọn tỉnh/thành phố.");
        }

        if (!provinceRepository.existsById(provinceCode)) {
            throw new RuntimeException("Tỉnh/thành phố không hợp lệ.");
        }

        String normalizedWardCode = normalizeBlank(wardCode);

        if (normalizedWardCode != null) {
            boolean validWard = wardRepository.existsByCodeAndProvinceCode(
                    normalizedWardCode,
                    provinceCode
            );

            if (!validWard) {
                throw new RuntimeException("Phường/xã không thuộc tỉnh/thành phố đã chọn.");
            }
        }
    }

    private String buildAreaKey(String provinceCode, String wardCode) {
        String normalizedWardCode = normalizeBlank(wardCode);

        if (normalizedWardCode != null) {
            return "WARD:" + normalizedWardCode;
        }

        return "PROVINCE:" + provinceCode;
    }

    private String normalizeBlank(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }

        return value.trim();
    }

    private DeliveryAreaResponse toResponse(DeliveryArea area) {
        String provinceName = provinceRepository.findById(area.getProvinceCode())
                .map(Province::getFullName)
                .orElse(area.getProvinceCode());

        String wardName = area.getWardCode() == null
                ? null
                : wardRepository.findById(area.getWardCode())
                  .map(Ward::getFullName)
                  .orElse(area.getWardCode());

        String scopeLabel = area.getWardCode() == null
                ? "Cả tỉnh/thành"
                : "Phường/Xã";

        return DeliveryAreaResponse.builder()
                .id(area.getId())
                .areaKey(area.getAreaKey())
                .provinceCode(area.getProvinceCode())
                .provinceName(provinceName)
                .wardCode(area.getWardCode())
                .wardName(wardName)
                .scopeLabel(scopeLabel)
                .shippingFee(area.getShippingFee())
                .status(area.getStatus())
                .note(area.getNote())
                .createdAt(area.getCreatedAt())
                .updatedAt(area.getUpdatedAt())
                .build();
    }
}