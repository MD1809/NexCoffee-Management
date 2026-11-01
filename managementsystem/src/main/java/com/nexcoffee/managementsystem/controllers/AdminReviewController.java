package com.nexcoffee.managementsystem.controllers;

import com.nexcoffee.managementsystem.dto.response.ProductReviewResponse;
import com.nexcoffee.managementsystem.services.ProductReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/reviews")
@RequiredArgsConstructor
public class AdminReviewController {

    private final ProductReviewService productReviewService;

    @GetMapping
    public ResponseEntity<List<ProductReviewResponse>> getAdminReviews(
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword
    ) {
        return ResponseEntity.ok(productReviewService.getAdminReviews(rating, status, keyword));
    }

    @PutMapping("/{id}/toggle-status")
    public ResponseEntity<ProductReviewResponse> toggleReviewStatus(
            @PathVariable Integer id,
            @RequestBody(required = false) Map<String, String> body
    ) {
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(productReviewService.toggleReviewStatus(id, reason));
    }
}
