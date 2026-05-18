package com.nexcoffee.managementsystem.controllers;

import com.nexcoffee.managementsystem.dto.request.product.ProductRequest;
import com.nexcoffee.managementsystem.dto.response.ProductResponse;
import com.nexcoffee.managementsystem.enums.ProductVariantStatus;
import com.nexcoffee.managementsystem.services.ProductService;
import com.nexcoffee.managementsystem.services.ProductVariantService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductService productService;
    @Autowired
    private ProductVariantService productVariantService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProductResponse> createProduct(
            @ModelAttribute @Valid ProductRequest request,
            @RequestParam("mainImage") MultipartFile mainImage,
            @RequestParam(value = "subImages", required = false) List<MultipartFile> subImages) {

        return ResponseEntity.ok(productService.createProduct(request, mainImage, subImages));
    }

    @GetMapping
    public ResponseEntity<List<ProductResponse>> getProductsForAdmin() {
        return ResponseEntity.ok(productService.getProductsForAdmin());
    }

    @GetMapping("/trashed")
    public ResponseEntity<List<ProductResponse>> getTrashedProducts() {
        return ResponseEntity.ok(productService.getTrashedProducts());
    }

    @GetMapping("/{productId}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable Integer productId) {
        return ResponseEntity.ok(productService.getProductById(productId));
    }

    @PutMapping(value = "edit/{productId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable("productId") Integer id,
            @ModelAttribute @Valid ProductRequest request,
            @RequestParam(value = "mainImage", required = false) MultipartFile mainImage,
            @RequestParam(value = "subImages", required = false) List<MultipartFile> subImages,
            @RequestParam(value = "deletedImageIds", required = false) List<Integer> deletedImageIds,
            @RequestParam(value = "deletedVariantIds", required = false) List<Integer> deletedVariantIds // <-- THÊM MỚI
    ) {
        // TRUYỀN THÊM BIẾN VÀO HÀM UPDATE
        return ResponseEntity.ok(productService.updateProduct(id, request, mainImage, subImages, deletedImageIds, deletedVariantIds));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<String> deleteProduct(@PathVariable Integer productId) {
        productService.softDeleteProduct(productId);

        return ResponseEntity.ok("Sản phẩm đã xóa thành công");
    }

    @PatchMapping("/{productId}/restore")
    public ResponseEntity<String> restoreProduct(@PathVariable Integer productId) {
        productService.restoreProduct(productId);
        return ResponseEntity.ok("Sản phẩm đã được khôi phục thành công");
    }

    @PatchMapping("/variants/{variantId}/status")
    public ResponseEntity<?> updateVariantStatus(
            @PathVariable("variantId") Integer variantId,
            @RequestParam("status") String statusStr
    ) {
        try {
            ProductVariantStatus statusEnum = ProductVariantStatus.valueOf(statusStr);
            productVariantService.updateVariantStatus(variantId, statusEnum);

            return ResponseEntity.ok().body(java.util.Map.of(
                    "success", true,
                    "message", "Cập nhật trạng thái thành công"
            ));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of(
                    "success", false,
                    "message", "Trạng thái không hợp lệ: " + statusStr
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of(
                    "success", false,
                    "message", "Lỗi hệ thống: " + e.getMessage()
            ));
        }
    }
}