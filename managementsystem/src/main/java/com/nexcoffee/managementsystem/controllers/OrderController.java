package com.nexcoffee.managementsystem.controllers;

import com.nexcoffee.managementsystem.dto.request.OrderRequest;
import com.nexcoffee.managementsystem.dto.response.OrderDetailResponse;
import com.nexcoffee.managementsystem.dto.response.OrderResponse;
import com.nexcoffee.managementsystem.entities.Order;
import com.nexcoffee.managementsystem.enums.OrderStatus;
import com.nexcoffee.managementsystem.enums.PaymentStatus;
import com.nexcoffee.managementsystem.services.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping("/today")
    public ResponseEntity<List<OrderResponse>> getTodayOrders() {
        List<Order> orders = orderService.getOrdersToday();

        List<OrderResponse> response = orders.stream()
                .map(this::mapToResponseSummary)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<OrderResponse>> getAllOrders(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        List<Order> orders = orderService.getAllOrders(date);

        List<OrderResponse> response = orders.stream()
                .map(this::mapToResponseSummary)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    private OrderResponse mapToResponseSummary(Order order) {
        return OrderResponse.builder()
                .id(order.getId())
                .code(order.getCode())
                .customerName(order.getFullName())
                .phone(order.getPhone())
                .address(order.getAddress())
                .total(order.getTotal())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus())
                .status(order.getStatus())
                .createdAt(order.getCreatedAt())
                .build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Integer id) {
        Order order = orderService.getOrderById(id);
        return ResponseEntity.ok(mapToResponse(order));
    }

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@RequestBody OrderRequest request) {
        Order savedOrder = orderService.createOrder(request);
        OrderResponse response = mapToResponse(savedOrder);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // API Cập nhật trạng thái đơn (Ví dụ: Chuyển từ Pending sang Processing)
    @PatchMapping("/{id}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable Integer id,
            @RequestParam OrderStatus status,
            @RequestParam(required = false) String cancelReason // Chỉ bắt buộc khi status = Cancelled
    ) {
        Order updatedOrder = orderService.updateOrderStatus(id, status, cancelReason);
        return ResponseEntity.ok(mapToResponse(updatedOrder));
    }

    // API Cập nhật trạng thái thanh toán (Ví dụ: Đã trả tiền, Đã hoàn tiền)
    @PatchMapping("/{id}/payment-status")
    public ResponseEntity<OrderResponse> updatePaymentStatus(
            @PathVariable Integer id,
            @RequestParam PaymentStatus paymentStatus
    ) {
        Order updatedOrder = orderService.updatePaymentStatus(id, paymentStatus);
        return ResponseEntity.ok(mapToResponse(updatedOrder));
    }

    private OrderResponse mapToResponse(Order order) {
        return OrderResponse.builder()
                .id(order.getId())
                .code(order.getCode())
                .customerName(order.getFullName())
                .phone(order.getPhone())
                .address(order.getAddress())
                .subtotal(order.getSubtotal())
                .shipping(order.getShipping())
                .discount(order.getDiscount())
                .total(order.getTotal())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus())
                .status(order.getStatus())
                .cancelReason(order.getCancelReason())
                .createdAt(order.getCreatedAt())
                .items(order.getOrderDetails().stream().map(detail -> {

                    // LẤY URL CỦA ẢNH CHÍNH
                    String mainImageUrl = detail.getProductVariant().getProduct().getImages().stream()
                            .filter(img -> img.getIsMain() != null && img.getIsMain())
                            .map(img -> img.getImageUrl())
                            .findFirst()
                            .orElse(null);

                    return OrderDetailResponse.builder()
                            .id(detail.getId())
                            .productName(detail.getProductVariant().getProduct().getName())
                            .size(detail.getProductVariant().getSize())
                            .quantity(detail.getQuantity())
                            .unitPrice(detail.getUnitPrice())
                            .totalPrice(detail.getTotalPrice())
                            .image(mainImageUrl) // <--- Truyền URL ảnh chính vào đây
                            .build();
                }).collect(Collectors.toList()))
                .build();
    }
}
