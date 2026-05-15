package com.nexcoffee.managementsystem.dto.response;

import com.nexcoffee.managementsystem.enums.CategoryStatus;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CategoryResponse {
    private Integer id;
    private String name;
    private String description;
    private Integer productCount;
    private CategoryStatus categoryStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}