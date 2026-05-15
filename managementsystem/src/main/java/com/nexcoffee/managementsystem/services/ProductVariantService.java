package com.nexcoffee.managementsystem.services;

import com.nexcoffee.managementsystem.dto.request.product.ProductVariantRequest;
import com.nexcoffee.managementsystem.dto.response.ProductVariantResponse;
import com.nexcoffee.managementsystem.entities.ProductVariant;
import com.nexcoffee.managementsystem.enums.ProductVariantStatus;
import com.nexcoffee.managementsystem.repositories.ProductVariantRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductVariantService {

    @Autowired
    private ProductVariantRepository variantRepository;

    public List<ProductVariantResponse> getVariantsByProductId(Integer productId) {
        return variantRepository.findAll().stream()
                .filter(v -> v.getProduct().getId().equals(productId))
                .map(v -> {
                    ProductVariantResponse vr = new ProductVariantResponse();
                    vr.setId(v.getId());
                    vr.setSize(v.getSize());
                    vr.setPrice(v.getPrice());
                    vr.setStatus(v.getStatus());
                    return vr;
                })
                .collect(Collectors.toList());
    }

    public ProductVariantResponse updateVariant(Integer id, ProductVariantRequest request) {
        ProductVariant variant = variantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy biến thể với ID: " + id));

        variant.setSize(request.getSize());
        variant.setPrice(request.getPrice());
        variant.setStatus(request.getStatus());
        variant.setUpdatedAt(LocalDateTime.now());

        ProductVariant savedVariant = variantRepository.save(variant);

        // Map sang response
        ProductVariantResponse res = new ProductVariantResponse();
        res.setId(savedVariant.getId());
        res.setSize(savedVariant.getSize());
        res.setPrice(savedVariant.getPrice());
        res.setStatus(savedVariant.getStatus());
        return res;
    }

    @Transactional
    public void updateVariantStatus(Integer variantId, ProductVariantStatus status) {
        ProductVariant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy biến thể (size) với ID: " + variantId));

        variant.setStatus(status);
        variant.setUpdatedAt(LocalDateTime.now());

        variantRepository.save(variant);
    }
}