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
    public ProductResponse createProduct(
            @ModelAttribute ProductRequest request,
            @RequestParam("mainImage") MultipartFile mainImage,
            @RequestParam(value = "subImages", required = false) List<MultipartFile> subImages) {

        return productService.createProduct(request, mainImage, subImages);
    }

    @GetMapping
    public List<ProductResponse> getAllProducts() {
        return productService.getAllProducts();
    }

    @GetMapping("/{productId}")
    public ProductResponse getProduct(@PathVariable Integer productId) {
        return productService.getProductById(productId);
    }

    @PutMapping(value = "/{productId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateProduct(
            @PathVariable Integer id,
            @ModelAttribute @Valid ProductRequest request,
            @RequestParam(value = "mainImage", required = false) MultipartFile mainImage,
            @RequestParam(value = "subImages", required = false) List<MultipartFile> subImages,
            @RequestParam(value = "deletedImageIds", required = false) List<Integer> deletedImageIds // Hứng danh sách ID cần xóa
    ) {
        return ResponseEntity.ok(productService.updateProduct(id, request, mainImage, subImages, deletedImageIds));
    }

    @DeleteMapping("/{productId}")
    public String deleteProduct(@PathVariable Integer productId) {
        productService.deleteProduct(productId);
        return "Product has been deleted";
    }

    @PatchMapping("/variants/{variantId}/status")
    public ResponseEntity<?> updateVariantStatus(
            @PathVariable("variantId") Integer variantId,
            @RequestParam("status") String statusStr // BƯỚC 1: Nhận String thay vì nhận trực tiếp Enum
    ) {
        try {
            // BƯỚC 2: Tự chuyển đổi String sang Enum
            ProductVariantStatus statusEnum = ProductVariantStatus.valueOf(statusStr);

            // BƯỚC 3: Gọi Service
            productVariantService.updateVariantStatus(variantId, statusEnum);

            return ResponseEntity.ok().body(java.util.Map.of(
                    "success", true,
                    "message", "Cập nhật trạng thái thành công"
            ));

        } catch (IllegalArgumentException e) {
            // Bắt lỗi nếu Frontend gửi lên chữ linh tinh không có trong Enum
            return ResponseEntity.badRequest().body(java.util.Map.of(
                    "success", false,
                    "message", "Trạng thái không hợp lệ: " + statusStr
            ));
        } catch (Exception e) {
            // Các lỗi khác (như không tìm thấy ID)
            return ResponseEntity.badRequest().body(java.util.Map.of(
                    "success", false,
                    "message", "Lỗi hệ thống: " + e.getMessage()
            ));
        }
    }
}