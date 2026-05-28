package com.nexcoffee.managementsystem.controllers;

import com.nexcoffee.managementsystem.dto.request.account.CancelOrderRequest;
import com.nexcoffee.managementsystem.dto.request.account.ChangePasswordRequest;
import com.nexcoffee.managementsystem.dto.response.account.UserOrderResponse;
import com.nexcoffee.managementsystem.services.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @GetMapping("/orders")
    public List<UserOrderResponse> getMyOrders() {
        return accountService.getMyOrders();
    }

    @GetMapping("/orders/{id}")
    public UserOrderResponse getMyOrderDetail(@PathVariable Integer id) {
        return accountService.getMyOrderDetail(id);
    }

    @PatchMapping("/orders/{id}/cancel")
    public UserOrderResponse cancelMyOrder(
            @PathVariable Integer id,
            @RequestBody(required = false) CancelOrderRequest request
    ) {
        return accountService.cancelMyOrder(id, request);
    }

    @PutMapping("/password")
    public Map<String, String> changePassword(
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        accountService.changePassword(request);

        return Map.of("message", "Đổi mật khẩu thành công.");
    }
}