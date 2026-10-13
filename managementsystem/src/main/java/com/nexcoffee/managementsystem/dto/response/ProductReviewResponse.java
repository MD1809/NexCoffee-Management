package com.nexcoffee.managementsystem.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductReviewResponse {

    private Integer id;
    private Integer productId;
    private String productName;
    private String productImage;
    private String categoryName;
    private String variantSize;

    private Long userId;
    private String userFullName;
    private String userAvatar;

    private Integer rating;
    private String comment;
    private String status;
    private LocalDateTime createdAt;

    private Integer orderId;
    private String orderCode;
    private boolean verifiedPurchase;
}
