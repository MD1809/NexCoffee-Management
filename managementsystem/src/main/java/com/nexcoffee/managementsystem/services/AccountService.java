package com.nexcoffee.managementsystem.services;

import com.nexcoffee.managementsystem.dto.request.account.CancelOrderRequest;
import com.nexcoffee.managementsystem.dto.request.account.ChangePasswordRequest;
import com.nexcoffee.managementsystem.dto.response.account.UserOrderItemResponse;
import com.nexcoffee.managementsystem.dto.response.account.UserOrderResponse;
import com.nexcoffee.managementsystem.entities.*;
import com.nexcoffee.managementsystem.enums.OrderStatus;
import com.nexcoffee.managementsystem.repositories.OrderRepository;
import com.nexcoffee.managementsystem.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AccountService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UserOrderResponse> getMyOrders() {
        User user = getCurrentUser();

        return orderRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(order -> toResponse(order, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public UserOrderResponse getMyOrderDetail(Integer orderId) {
        User user = getCurrentUser();

        Order order = orderRepository.findByIdAndUser(orderId, user)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng."));

        return toResponse(order, true);
    }

    public UserOrderResponse cancelMyOrder(Integer orderId, CancelOrderRequest request) {
        User user = getCurrentUser();

        Order order = orderRepository.findByIdAndUser(orderId, user)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng."));

        if (order.getStatus() != OrderStatus.Pending) {
            throw new RuntimeException("Chỉ có thể hủy đơn hàng đang ở trạng thái chờ duyệt.");
        }

        order.setStatus(OrderStatus.Cancelled);

        String reason = request == null ? null : normalizeBlank(request.getCancelReason());
        order.setCancelReason(reason == null ? "Khách hàng hủy đơn" : reason);

        return toResponse(orderRepository.save(order), true);
    }

    public void changePassword(ChangePasswordRequest request) {
        User user = getCurrentUser();

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu hiện tại không đúng.");
        }

        validatePasswordStrength(request.getNewPassword());

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Xác nhận mật khẩu không khớp.");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (
                authentication == null ||
                        !authentication.isAuthenticated() ||
                        authentication instanceof AnonymousAuthenticationToken
        ) {
            throw new RuntimeException("Bạn cần đăng nhập.");
        }

        String email = authentication.getName();

        if (email == null || email.isBlank() || "anonymousUser".equals(email)) {
            throw new RuntimeException("Bạn cần đăng nhập.");
        }

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản."));
    }

    private UserOrderResponse toResponse(Order order, boolean includeItems) {
        List<UserOrderItemResponse> items = includeItems && order.getOrderDetails() != null
                ? order.getOrderDetails()
                  .stream()
                  .map(this::toItemResponse)
                  .toList()
                : List.of();

        return UserOrderResponse.builder()
                .id(order.getId())
                .code(order.getCode())
                .fullName(order.getFullName())
                .phone(order.getPhone())
                .email(order.getEmail())
                .address(order.getAddress())
                .subtotal(order.getSubtotal())
                .shipping(order.getShipping())
                .discount(order.getDiscount())
                .total(order.getTotal())
                .paymentMethod(order.getPaymentMethod() == null ? null : order.getPaymentMethod().name())
                .paymentStatus(order.getPaymentStatus() == null ? null : order.getPaymentStatus().name())
                .status(order.getStatus() == null ? null : order.getStatus().name())
                .note(order.getNote())
                .cancelReason(order.getCancelReason())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .items(items)
                .build();
    }

    private UserOrderItemResponse toItemResponse(OrderDetail detail) {
        ProductVariant variant = detail.getProductVariant();
        Product product = variant == null ? null : variant.getProduct();

        Long totalPrice = detail.getTotalPrice();

        return UserOrderItemResponse.builder()
                .productId(product == null ? null : product.getId())
                .productName(product == null ? "Sản phẩm không tồn tại" : product.getName())
                .variantId(variant == null ? null : variant.getId())
                .size(variant == null ? null : variant.getSize())
                .quantity(detail.getQuantity())
                .unitPrice(detail.getUnitPrice())
                .totalPrice(totalPrice)
                .lineTotal(totalPrice)
                .image(getMainImage(product))
                .build();
    }

    private String getMainImage(Product product) {
        if (product == null || product.getImages() == null || product.getImages().isEmpty()) {
            return null;
        }

        return product.getImages()
                .stream()
                .filter(image -> Boolean.TRUE.equals(image.getIsMain()))
                .findFirst()
                .map(ProductImage::getImageUrl)
                .orElseGet(() -> product.getImages().get(0).getImageUrl());
    }

    private String normalizeBlank(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }

        return value.trim();
    }
    private void validatePasswordStrength(String password) {
        if (password == null || password.length() < 8) {
            throw new RuntimeException("Mật khẩu phải có ít nhất 8 ký tự.");
        }

        if (!password.matches(".*[A-Z].*")) {
            throw new RuntimeException("Mật khẩu phải chứa ít nhất một chữ hoa.");
        }

        if (!password.matches(".*[a-z].*")) {
            throw new RuntimeException("Mật khẩu phải chứa ít nhất một chữ thường.");
        }

        if (!password.matches(".*[0-9].*")) {
            throw new RuntimeException("Mật khẩu phải chứa ít nhất một chữ số.");
        }

        if (!password.matches(".*[!@#$%^&*(),.?\":{}|<>].*")) {
            throw new RuntimeException("Mật khẩu phải chứa ít nhất một ký tự đặc biệt.");
        }
    }
}