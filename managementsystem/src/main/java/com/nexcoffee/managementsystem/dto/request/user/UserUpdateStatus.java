package com.nexcoffee.managementsystem.dto.request.user;

import com.nexcoffee.managementsystem.enums.UserStatus;
import lombok.Data;

@Data
public class UserUpdateStatus {
    private UserStatus status;
}
