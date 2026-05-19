package com.nexcoffee.managementsystem.controllers;

import com.nexcoffee.managementsystem.dto.request.cart.AddCartItemRequest;
import com.nexcoffee.managementsystem.dto.request.cart.UpdateCartItemRequest;
import com.nexcoffee.managementsystem.dto.response.cart.CartResponse;
import com.nexcoffee.managementsystem.services.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<CartResponse> getCart(
            @RequestHeader(value = "X-Cart-Token", required = false) String cartToken
    ) {
        return ResponseEntity.ok(cartService.getCart(cartToken));
    }

    @PostMapping("/items")
    public ResponseEntity<CartResponse> addItem(
            @RequestHeader(value = "X-Cart-Token", required = false) String cartToken,
            @Valid @RequestBody AddCartItemRequest request
    ) {
        return ResponseEntity.ok(cartService.addItem(cartToken, request));
    }

    @PatchMapping("/items/{cartItemId}")
    public ResponseEntity<CartResponse> updateItem(
            @RequestHeader(value = "X-Cart-Token", required = false) String cartToken,
            @PathVariable Long cartItemId,
            @Valid @RequestBody UpdateCartItemRequest request
    ) {
        return ResponseEntity.ok(cartService.updateItem(cartToken, cartItemId, request));
    }

    @DeleteMapping("/items/{cartItemId}")
    public ResponseEntity<CartResponse> removeItem(
            @RequestHeader(value = "X-Cart-Token", required = false) String cartToken,
            @PathVariable Long cartItemId
    ) {
        return ResponseEntity.ok(cartService.removeItem(cartToken, cartItemId));
    }

    @PostMapping("/merge")
    public ResponseEntity<CartResponse> mergeGuestCart(
            @RequestHeader(value = "X-Cart-Token", required = false) String cartToken
    ) {
        return ResponseEntity.ok(cartService.mergeGuestCart(cartToken));
    }
}