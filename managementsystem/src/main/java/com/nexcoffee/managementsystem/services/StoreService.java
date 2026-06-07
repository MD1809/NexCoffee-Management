package com.nexcoffee.managementsystem.services;

import com.nexcoffee.managementsystem.dto.request.store.StoreRequest;
import com.nexcoffee.managementsystem.dto.response.store.StoreResponse;
import com.nexcoffee.managementsystem.entities.Store;
import com.nexcoffee.managementsystem.enums.StoreStatus;
import com.nexcoffee.managementsystem.repositories.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.nexcoffee.managementsystem.exceptions.InvalidOperationException;
import com.nexcoffee.managementsystem.exceptions.ResourceNotFoundException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StoreService {

    private final StoreRepository storeRepository;

    public List<StoreResponse> getAllStores() {
        return storeRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public StoreResponse getStoreById(Long id) {
        Store store = getStoreOrThrow(id);
        return toResponse(store);
    }

    public StoreResponse createStore(StoreRequest request) {
        validateStoreRequest(request);

        String name = request.getName().trim();

        if (storeRepository.existsByNameIgnoreCase(name)) {
            throw new InvalidOperationException("Tên cửa hàng đã tồn tại.");
        }

        StoreStatus status = parseStatus(request.getStatus());

        Store store = Store.builder()
                .name(name)
                .phone(normalizeBlank(request.getPhone()))
                .address(request.getAddress().trim())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .status(status)
                .build();

        Store savedStore = storeRepository.save(store);

        return toResponse(savedStore);
    }

    public StoreResponse updateStore(Long id, StoreRequest request) {
        validateStoreRequest(request);

        Store store = getStoreOrThrow(id);

        String name = request.getName().trim();

        if (storeRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new InvalidOperationException("Tên cửa hàng đã tồn tại.");
        }

        store.setName(name);
        store.setPhone(normalizeBlank(request.getPhone()));
        store.setAddress(request.getAddress().trim());
        store.setLatitude(request.getLatitude());
        store.setLongitude(request.getLongitude());

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            store.setStatus(parseStatus(request.getStatus()));
        }

        Store savedStore = storeRepository.save(store);

        return toResponse(savedStore);
    }

    public StoreResponse updateStatus(Long id, String status) {
        Store store = getStoreOrThrow(id);

        store.setStatus(parseStatus(status));

        Store savedStore = storeRepository.save(store);

        return toResponse(savedStore);
    }

    public void deleteStore(Long id) {
        Store store = getStoreOrThrow(id);

        storeRepository.delete(store);
    }

    private Store getStoreOrThrow(Long id) {
        return storeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cửa hàng."));
    }

    private void validateStoreRequest(StoreRequest request) {
        if (request.getLatitude() == null || request.getLatitude() < -90 || request.getLatitude() > 90) {
            throw new InvalidOperationException("Vĩ độ không hợp lệ.");
        }

        if (request.getLongitude() == null || request.getLongitude() < -180 || request.getLongitude() > 180) {
            throw new InvalidOperationException("Kinh độ không hợp lệ.");
        }
    }

    private StoreStatus parseStatus(String status) {
        if (status == null || status.isBlank()) {
            return StoreStatus.ACTIVE;
        }

        try {
            return StoreStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new InvalidOperationException("Trạng thái cửa hàng không hợp lệ.");
        }
    }

    private StoreResponse toResponse(Store store) {
        return StoreResponse.builder()
                .id(store.getId())
                .name(store.getName())
                .phone(store.getPhone())
                .address(store.getAddress())
                .latitude(store.getLatitude())
                .longitude(store.getLongitude())
                .status(store.getStatus().name())
                .createdAt(store.getCreatedAt())
                .updatedAt(store.getUpdatedAt())
                .build();
    }

    private String normalizeBlank(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }

        return value.trim();
    }

    public List<StoreResponse> getActiveStores() {
        return storeRepository.findByStatus(StoreStatus.ACTIVE)
                .stream()
                .map(this::toResponse)
                .toList();
    }
}