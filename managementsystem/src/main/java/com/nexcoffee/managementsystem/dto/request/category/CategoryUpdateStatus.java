package com.nexcoffee.managementsystem.dto.request.category;

import com.nexcoffee.managementsystem.enums.CategoryStatus;
import lombok.Data;

@Data
public class CategoryUpdateStatus {
    private CategoryStatus status;
}
