package com.nexcoffee.managementsystem.controllers;

import com.nexcoffee.managementsystem.dto.request.CreateReviewRequest;
import com.nexcoffee.managementsystem.dto.response.FeaturedReviewsResponse;
import com.nexcoffee.managementsystem.dto.response.ProductReviewResponse;
import com.nexcoffee.managementsystem.services.ProductReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ProductReviewController {

    private final ProductReviewService productReviewService;

    @PostMapping
    public ResponseEntity<ProductReviewResponse> createReview(@Valid @RequestBody CreateReviewRequest request) {
        ProductReviewResponse response = productReviewService.createReview(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<ProductReviewResponse>> getReviewsByOrder(@PathVariable Integer orderId) {
        return ResponseEntity.ok(productReviewService.getReviewsByOrderId(orderId));
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ProductReviewResponse>> getReviewsByProduct(@PathVariable Integer productId) {
        return ResponseEntity.ok(productReviewService.getReviewsByProductId(productId));
    }

    @GetMapping("/featured")
    public ResponseEntity<FeaturedReviewsResponse> getFeaturedReviews(
            @RequestParam(defaultValue = "6") int limit
    ) {
        return ResponseEntity.ok(productReviewService.getFeaturedReviews(limit));
    }
}
