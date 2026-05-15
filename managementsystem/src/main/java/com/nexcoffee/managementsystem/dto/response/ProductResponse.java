package com.nexcoffee.managementsystem.dto.response;

import com.nexcoffee.managementsystem.enums.ProductsStatus;
import lombok.Data;
import java.util.List;

@Data
public class ProductResponse {
    private Integer id;
    private String name;
    private String description;
    private ImageProductResponse mainImage;
    private List<ImageProductResponse> galleryImages;
    private Integer categoryId;
    private String categoryName;
    private ProductsStatus status;
    private List<ProductVariantResponse> variants;
}