package com.nexcoffee.managementsystem.controllers;

import com.nexcoffee.managementsystem.dto.request.posOrder.OrderPosRequest;
import com.nexcoffee.managementsystem.dto.response.ProductResponse;
import com.nexcoffee.managementsystem.repositories.CategoryRepository;
import com.nexcoffee.managementsystem.services.OrderService;
import com.nexcoffee.managementsystem.services.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/pos")
@RequiredArgsConstructor
public class PosController {

    private final ProductService productService;
    private final OrderService orderService;
    private final CategoryRepository categoryRepository;

    @GetMapping("/products")
    public ResponseEntity<List<ProductResponse>> getProductsForPos() {
        List<ProductResponse> products = productService.getAllActiveProductsVariant();
        return ResponseEntity.ok(products);
    }

    @PostMapping("/checkout")
    public ResponseEntity<Map<String, String>> checkoutOrder(@Valid @RequestBody OrderPosRequest request) {
        orderService.createPosOrder(request);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Thanh toán đơn hàng thành công!");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/categories")
    public ResponseEntity<?> getCategoriesForPos() {
        var categories = categoryRepository.findByDeletedFalse().stream().map(cat -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", cat.getId());
            map.put("name", cat.getName());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(categories);
    }
}