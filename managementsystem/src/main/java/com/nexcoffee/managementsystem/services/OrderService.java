package com.nexcoffee.managementsystem.services;

import com.nexcoffee.managementsystem.dto.request.OrderRequest;
import com.nexcoffee.managementsystem.entities.Order;
import com.nexcoffee.managementsystem.entities.OrderDetail;
import com.nexcoffee.managementsystem.entities.ProductVariant;
import com.nexcoffee.managementsystem.entities.User;
import com.nexcoffee.managementsystem.enums.OrderStatus;
import com.nexcoffee.managementsystem.enums.PaymentStatus;
import com.nexcoffee.managementsystem.repositories.OrderDetailRepository;
import com.nexcoffee.managementsystem.repositories.OrderRepository;
import com.nexcoffee.managementsystem.repositories.ProductVariantRepository;
import com.nexcoffee.managementsystem.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final UserRepository userRepository;
    private final ProductVariantRepository productVariantRepository;

    // Lấy danh sách đơn hàng hôm nay
    public List<Order> getOrdersToday() {
        LocalDateTime startOfDay = LocalDateTime.now().with(LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.now().with(LocalTime.MAX);

        return orderRepository.findByCreatedAtBetween(startOfDay, endOfDay);
    }

    // Lấy danh sách tất cả đơn hàng
    public List<Order> getAllOrders(LocalDate filterDate) {
        if (filterDate == null) {
            return orderRepository.findAll();
        }
        LocalDateTime startOfDay = filterDate.atStartOfDay();
        LocalDateTime endOfDay = filterDate.atTime(LocalTime.MAX);

        return orderRepository.findByCreatedAtBetween(startOfDay, endOfDay);
    }

    // Lấy đơn hàng chi tiết qua id
    public Order getOrderById(Integer id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));
    }

    @Transactional
    public Order createOrder(OrderRequest request) {
        User user = null;
        if (request.getUserId() != null) {
            user = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
        }

        Order order = Order.builder()
                .user(user)
                .code(generateUniqueOrderCode())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .address(request.getAddress())
                .note(request.getNote())
                .shipping(request.getShipping() != null ? request.getShipping() : 0L)
                .discount(request.getDiscount() != null ? request.getDiscount() : 0L)
                .paymentMethod(request.getPaymentMethod())
                .paymentStatus(PaymentStatus.unpaid)
                .status(OrderStatus.Pending)
                .subtotal(0L)
                .total(0L)
                .build();

        Order savedOrder = orderRepository.save(order);

        long subtotal = 0L;
        List<OrderDetail> orderDetails = new ArrayList<>();

        for (OrderRequest.OrderDetailRequest item : request.getItems()) {
            ProductVariant variant = productVariantRepository.findById(item.getProductVariantId())
                    .orElseThrow(() -> new RuntimeException("Product variant not found"));

            long unitPrice = variant.getPrice().longValue();
            long totalPrice = unitPrice * item.getQuantity();
            subtotal += totalPrice;

            OrderDetail detail = OrderDetail.builder()
                    .order(savedOrder)
                    .productVariant(variant)
                    .quantity(item.getQuantity())
                    .unitPrice(unitPrice)
                    .totalPrice(totalPrice)
                    .build();

            orderDetails.add(detail);
        }

        orderDetailRepository.saveAll(orderDetails);

        savedOrder.setSubtotal(subtotal);
        savedOrder.setTotal(subtotal + savedOrder.getShipping() - savedOrder.getDiscount());
        savedOrder.setOrderDetails(orderDetails);

        return orderRepository.save(savedOrder);
    }

    @Transactional
    public Order updateOrderStatus(Integer orderId, OrderStatus newStatus, String cancelReason) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        order.setStatus(newStatus);

        if (newStatus == OrderStatus.Cancelled) {
            order.setCancelReason(cancelReason);
        }

        return orderRepository.save(order);
    }

    @Transactional
    public Order updatePaymentStatus(Integer orderId, PaymentStatus newPaymentStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));

        order.setPaymentStatus(newPaymentStatus);

        return orderRepository.save(order);
    }

    private String generateUniqueOrderCode() {
        String uuid = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        return "NEX-" + uuid;
    }
}