package com.nexcoffee.managementsystem.dto.response;

import com.nexcoffee.managementsystem.enums.ProductsStatus;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ProductSimpleResponse {
    private Integer id;
    private String mainImageUrl;
    private String name;
    private String description;
    private ProductsStatus status;
    private LocalDateTime createdAt;
}