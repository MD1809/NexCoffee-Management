package com.nexcoffee.managementsystem.dto.request.checkout;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class CheckoutRequest {

    @NotBlank(message = "Họ và tên không được để trống")
    private String fullName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(
            regexp = "^(0)(3|5|7|8|9)[0-9]{8}$",
            message = "Số điện thoại Việt Nam không hợp lệ"
    )
    private String phone;

    @Email(message = "Email không hợp lệ")
    private String email;

    @NotBlank(message = "Tỉnh/thành phố không được để trống")
    private String provinceCode;

    @NotBlank(message = "Phường/xã không được để trống")
    private String wardCode;

    @NotBlank(message = "Địa chỉ chi tiết không được để trống")
    private String addressDetail;

    private String note;

    private String paymentMethod = "COD";
}