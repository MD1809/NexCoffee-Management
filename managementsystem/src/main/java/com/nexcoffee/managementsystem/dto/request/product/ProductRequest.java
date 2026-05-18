package com.nexcoffee.managementsystem.dto.request.product;

import com.nexcoffee.managementsystem.enums.ProductsStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProductRequest {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(max = 255, message = "Tên sản phẩm không được vượt quá 255 ký tự")
    private String name;

    private String description;

    @NotNull(message = "Danh mục không được để trống")
    private Integer categoryId;

    @NotNull(message = "Trạng thái không được để trống")
    private ProductsStatus status;

    @NotBlank(message = "Sản phẩm phải có ít nhất một biến thể (size)")
    private String variants;

}