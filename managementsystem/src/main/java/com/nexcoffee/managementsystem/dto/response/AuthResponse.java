package com.nexcoffee.managementsystem.dto.response;

import com.nexcoffee.managementsystem.enums.Role;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {

    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private Role role;

    private String tokenType;
    private String token;
}