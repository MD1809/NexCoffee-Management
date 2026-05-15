package com.nexcoffee.managementsystem.dto.request.category;

import com.nexcoffee.managementsystem.enums.CategoryStatus;
import lombok.Data;

@Data
public class CategoryRequest {
    private String name;
    private String description;
    private CategoryStatus categoryStatus;
}
