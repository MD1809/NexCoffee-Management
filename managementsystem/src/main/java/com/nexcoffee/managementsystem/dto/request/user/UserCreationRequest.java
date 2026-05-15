package com.nexcoffee.managementsystem.dto.request.user;

import com.nexcoffee.managementsystem.enums.RoleUser;
import com.nexcoffee.managementsystem.enums.UserStatus;

import lombok.Data;

@Data
public class UserCreationRequest {

    private String fullName;
    private String email;
    private String phone;
    private String password;
    private RoleUser role;
    private UserStatus status;
}
