package com.nexcoffee.managementsystem.dto.request.product;

import com.nexcoffee.managementsystem.enums.ProductsStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProductRequest {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    private String name;

    private String description;

    @NotNull(message = "Phải chọn danh mục (Category ID)")
    private Integer categoryId;

    @NotNull(message = "Trạng thái không được để trống")
    private ProductsStatus status;

    @NotBlank(message = "Sản phẩm phải có ít nhất một biến thể (size)")
    private String variants;

}