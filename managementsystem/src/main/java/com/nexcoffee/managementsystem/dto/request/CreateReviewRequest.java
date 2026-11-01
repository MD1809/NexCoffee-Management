package com.nexcoffee.managementsystem.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateReviewRequest {

    @NotNull(message = "Mã đơn hàng không được để trống")
    private Integer orderId;

    @NotNull(message = "Mã sản phẩm không được để trống")
    private Integer productId;

    private Integer productVariantId;

    @NotNull(message = "Số sao đánh giá không được để trống")
    @Min(value = 1, message = "Đánh giá tối thiểu 1 sao")
    @Max(value = 5, message = "Đánh giá tối đa 5 sao")
    private Integer rating;

    @NotBlank(message = "Nội dung nhận xét không được để trống")
    @Size(max = 300, message = "Nội dung nhận xét không được vượt quá 300 ký tự")
    private String comment;
}
