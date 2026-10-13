package com.nexcoffee.managementsystem.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeaturedReviewsResponse {

    private List<ProductReviewResponse> reviews;
    private Double averageRating;
    private Long totalReviews;
    private Double satisfactionRate; // ví dụ 98.5%
}
