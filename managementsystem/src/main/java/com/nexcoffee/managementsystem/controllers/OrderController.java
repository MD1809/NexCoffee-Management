package com.nexcoffee.managementsystem.controllers;

import com.nexcoffee.managementsystem.dto.request.OrderRequest;
import com.nexcoffee.managementsystem.dto.request.OrderStatusUpdateRequest;
import com.nexcoffee.managementsystem.dto.response.OrderDetailResponse;
import com.nexcoffee.managementsystem.dto.response.OrderResponse;
import com.nexcoffee.managementsystem.entities.Order;
import com.nexcoffee.managementsystem.enums.PaymentStatus;
import com.nexcoffee.managementsystem.repositories.OrderDetailRepository;
import com.nexcoffee.managementsystem.services.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.nexcoffee.managementsystem.entities.Store;
import com.nexcoffee.managementsystem.repositories.StoreRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final StoreRepository storeRepository;

    // ==============================================================================
    // PHẦN 1: CÁC API MỚI DÀNH RIÊNG CHO TRANG DASHBOARD THỐNG KÊ
    // ==============================================================================

    // 1. Lấy tổng doanh thu trong ngày
    @GetMapping("/dashboard/revenue")
    public ResponseEntity<Long> getDashboardRevenue(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        Long revenue = orderService.getRevenueByDate(date);
        return ResponseEntity.ok(revenue != null ? revenue : 0L);
    }

    // 2. Lấy thống kê số lượng từng món bán được trong ngày
    @GetMapping("/dashboard/sales-stats")
    public ResponseEntity<List<OrderDetailRepository.ProductSaleStats>> getDashboardProductSales(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(orderService.getProductSalesStatsByDate(date));
    }

    // 3. Lấy danh sách đơn hàng chi tiết (Kèm thông tin ai bán, ai giao)
    @GetMapping("/dashboard/list")
    public ResponseEntity<List<OrderResponse>> getDashboardOrders(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<Order> orders = orderService.getOrdersWithStaffInfoByDate(date);

        List<OrderResponse> response = orders.stream()
                .map(this::mapToDashboardResponseSummary)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    // Mapper riêng cho Dashboard để lấy thêm tên nhân viên và shipper
    private OrderResponse mapToDashboardResponseSummary(Order order) {
        OrderResponse response = mapToResponseSummary(order);
        // Bổ sung thông tin nhân sự (Yêu cầu bạn thêm 2 trường này vào class OrderResponse)
        if (order.getStaff() != null) {
            response.setStaffName(order.getStaff().getFullName()); // Giả sử entity User có getFullName()
        }
        if (order.getShipper() != null) {
            response.setShipperName(order.getShipper().getFullName());
        }
        return response;
    }


    // ==============================================================================
    // PHẦN 2: CÁC API HIỆN TẠI (GIỮ NGUYÊN ĐỂ KHÔNG ẢNH HƯỞNG TRANG CŨ)
    // ==============================================================================

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
        OrderResponse.OrderResponseBuilder builder = OrderResponse.builder()
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
                .processedAt(order.getProcessedAt())
                .shippedAt(order.getShippedAt())
                .completedAt(order.getCompletedAt());

        applyDeliveryInfo(builder, order);

        OrderResponse response = builder.build();

        if (order.getStaff() != null) {
            response.setStaffName(order.getStaff().getFullName());
        }

        if (order.getShipper() != null) {
            response.setShipperName(order.getShipper().getFullName());
        }

        return response;
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

    @PatchMapping("/{id}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable Integer id,
            @RequestBody OrderStatusUpdateRequest request
    ) {
        // Truyền đầy đủ shipperId và staffId vào service
        Order updatedOrder = orderService.updateOrderStatus(
                id,
                request.getStatus(),
                request.getCancelReason(),
                request.getShipperId(),
                request.getStaffId()
        );

        return ResponseEntity.ok(mapToResponse(updatedOrder));
    }

    @PatchMapping("/{id}/payment-status")
    public ResponseEntity<OrderResponse> updatePaymentStatus(
            @PathVariable Integer id,
            @RequestParam PaymentStatus paymentStatus
    ) {
        Order updatedOrder = orderService.updatePaymentStatus(id, paymentStatus);
        return ResponseEntity.ok(mapToResponse(updatedOrder));
    }

    private OrderResponse mapToResponse(Order order) {
        OrderResponse.OrderResponseBuilder builder = OrderResponse.builder()
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
                .processedAt(order.getProcessedAt())
                .shippedAt(order.getShippedAt())
                .completedAt(order.getCompletedAt())
                .items(order.getOrderDetails().stream().map(detail -> {
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
                            .image(mainImageUrl)
                            .build();
                }).collect(Collectors.toList()));

        applyDeliveryInfo(builder, order);

        OrderResponse response = builder.build();

        if (order.getStaff() != null) {
            response.setStaffName(order.getStaff().getFullName());
        }

        if (order.getShipper() != null) {
            response.setShipperName(order.getShipper().getFullName());
        }

        return response;
    }
    private void applyDeliveryInfo(OrderResponse.OrderResponseBuilder builder, Order order) {
        builder
                .customerLatitude(order.getCustomerLatitude())
                .customerLongitude(order.getCustomerLongitude())
                .nearestStoreId(order.getNearestStoreId())
                .deliveryDistanceMeters(order.getDeliveryDistanceMeters())
                .deliveryDurationSeconds(order.getDeliveryDurationSeconds());

        if (order.getNearestStoreId() == null) {
            return;
        }

        storeRepository.findById(order.getNearestStoreId()).ifPresent(store -> {
            builder
                    .nearestStoreName(store.getName())
                    .nearestStoreAddress(store.getAddress())
                    .nearestStoreLatitude(store.getLatitude())
                    .nearestStoreLongitude(store.getLongitude());
        });
    }
}