package com.nexcoffee.managementsystem.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "Họ tên không được để trống")
    private String fullName;

    @Email(message = "Email không hợp lệ")
    @NotBlank(message = "Email không được để trống")
    private String email;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(
            regexp = "^0(3|5|7|8|9)[0-9]{8}$",
            message = "Số điện thoại không hợp lệ."
    )
    private String phone;

    @Size(min = 8, message = "Mật khẩu phải từ 8 ký tự")
    @NotBlank(message = "Mật khẩu không được để trống")
    private String password;


    @NotBlank(message = "Mật khẩu xác nhận không được để trống")
    private String passwordConfirmation;

}