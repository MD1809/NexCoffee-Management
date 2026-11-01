package com.nexcoffee.managementsystem.exceptions;

import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class AccountDeactivatedException extends RuntimeException {

    private final String reason;
    private final LocalDateTime deactivatedAt;

    public AccountDeactivatedException(String message, String reason, LocalDateTime deactivatedAt) {
        super(message);
        this.reason = reason;
        this.deactivatedAt = deactivatedAt;
    }
}
