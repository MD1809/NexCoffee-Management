package com.nexcoffee.managementsystem.controllers;

import com.nexcoffee.managementsystem.dto.request.checkout.CheckoutRequest;
import com.nexcoffee.managementsystem.dto.response.checkout.CheckoutResponse;
import com.nexcoffee.managementsystem.services.CheckoutService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/checkout")
@RequiredArgsConstructor
public class CheckoutController {

    private final CheckoutService checkoutService;

    @PostMapping("/place-order")
    public CheckoutResponse placeOrder(
            @Valid @RequestBody CheckoutRequest request
    ) {
        return checkoutService.placeOrder(request);
    }
}