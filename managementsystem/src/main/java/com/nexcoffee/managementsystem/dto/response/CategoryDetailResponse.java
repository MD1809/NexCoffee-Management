package com.nexcoffee.managementsystem.dto.response;

import lombok.Data;
import java.util.List;

@Data
public class CategoryDetailResponse {
    private CategoryResponse category;
    private List<ProductSimpleResponse> products;
}