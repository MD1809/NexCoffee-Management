package com.nexcoffee.managementsystem.dto.request.store;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class StoreRequest {

    @NotBlank(message = "Tên cửa hàng không được để trống")
    @Size(max = 150, message = "Tên cửa hàng không được vượt quá 150 ký tự")
    private String name;

    @Pattern(
            regexp = "^(0)(3|5|7|8|9)[0-9]{8}$|^$",
            message = "Số điện thoại Việt Nam không hợp lệ"
    )
    private String phone;

    @NotBlank(message = "Địa chỉ cửa hàng không được để trống")
    @Size(max = 500, message = "Địa chỉ không được vượt quá 500 ký tự")
    private String address;

    @NotNull(message = "Vĩ độ không được để trống")
    @DecimalMin(value = "-90.0", message = "Vĩ độ không hợp lệ")
    @DecimalMax(value = "90.0", message = "Vĩ độ không hợp lệ")
    private Double latitude;

    @NotNull(message = "Kinh độ không được để trống")
    @DecimalMin(value = "-180.0", message = "Kinh độ không hợp lệ")
    @DecimalMax(value = "180.0", message = "Kinh độ không hợp lệ")
    private Double longitude;

    private String status;
}