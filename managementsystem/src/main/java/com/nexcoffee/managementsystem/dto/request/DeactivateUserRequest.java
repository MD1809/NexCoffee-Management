package com.nexcoffee.managementsystem.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeactivateUserRequest {

    @NotBlank(message = "Vui lòng nhập lý do vô hiệu hóa tài khoản")
    private String reason;
}
