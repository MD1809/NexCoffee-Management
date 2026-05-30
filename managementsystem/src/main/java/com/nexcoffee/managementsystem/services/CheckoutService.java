package com.nexcoffee.managementsystem.services;

import com.nexcoffee.managementsystem.dto.request.checkout.CheckoutRequest;
import com.nexcoffee.managementsystem.dto.response.checkout.CheckoutItemResponse;
import com.nexcoffee.managementsystem.dto.response.checkout.CheckoutResponse;
import com.nexcoffee.managementsystem.entities.*;
import com.nexcoffee.managementsystem.enums.CartStatus;
import com.nexcoffee.managementsystem.enums.OrderStatus;
import com.nexcoffee.managementsystem.enums.PaymentMethod;
import com.nexcoffee.managementsystem.enums.PaymentStatus;
import com.nexcoffee.managementsystem.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.nexcoffee.managementsystem.dto.request.delivery.DeliveryPreviewRequest;
import com.nexcoffee.managementsystem.dto.response.delivery.DeliveryPreviewResponse;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class CheckoutService {

    private final CartRepository cartRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final DeliveryPreviewService deliveryPreviewService;
    private final OrderMailService orderMailService;

    public CheckoutResponse placeOrder(CheckoutRequest request) {
        User currentUser = getCurrentUserOrNull();

        if (currentUser == null) {
            throw new RuntimeException("Bạn cần đăng nhập để thanh toán.");
        }

        Cart cart = cartRepository.findByUserAndStatus(currentUser, CartStatus.ACTIVE)
                .orElseThrow(() -> new RuntimeException("Giỏ hàng của bạn đang trống."));

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new RuntimeException("Giỏ hàng của bạn đang trống.");
        }

        long subtotal = calculateSubtotal(cart);

        DeliveryPreviewRequest previewRequest = new DeliveryPreviewRequest();
        previewRequest.setCustomerLatitude(request.getCustomerLatitude());
        previewRequest.setCustomerLongitude(request.getCustomerLongitude());
        previewRequest.setSubtotal(subtotal);

        DeliveryPreviewResponse deliveryPreview = deliveryPreviewService.preview(previewRequest);

        if (!Boolean.TRUE.equals(deliveryPreview.getDeliverable())) {
            throw new RuntimeException(deliveryPreview.getMessage());
        }

        long shipping = deliveryPreview.getFinalShippingFee();
        long discount = 0L;
        long total = subtotal + shipping - discount;

        String mapAddress = request.getFormattedAddress().trim();
        String extraAddressDetail = normalizeBlank(request.getAddressDetail());

        String fullAddress = extraAddressDetail == null
                ? mapAddress
                : extraAddressDetail + ", " + mapAddress;

        Order order = Order.builder()
                .user(currentUser)
                .code(generateOrderCode())
                .fullName(request.getFullName().trim())
                .phone(request.getPhone().trim())
                .email(normalizeBlank(request.getEmail()))
                .address(fullAddress)
                .formattedAddress(mapAddress)
                .customerLatitude(request.getCustomerLatitude())
                .customerLongitude(request.getCustomerLongitude())
                .nearestStoreId(deliveryPreview.getNearestStoreId())
                .deliveryDistanceMeters(deliveryPreview.getDistanceMeters())
                .deliveryDurationSeconds(deliveryPreview.getDurationSeconds())
                .subtotal(subtotal)
                .shipping(shipping)
                .discount(discount)
                .total(total)
                .paymentMethod(parsePaymentMethod(request.getPaymentMethod()))
                .paymentStatus(PaymentStatus.unpaid)
                .status(OrderStatus.Pending)
                .note(normalizeBlank(request.getNote()))
                .build();

        List<OrderDetail> orderDetails = new ArrayList<>();

        for (CartItem cartItem : cart.getItems()) {
            ProductVariant variant = cartItem.getProductVariant();

            long unitPrice = Math.round(cartItem.getUnitPrice());
            long lineTotal = unitPrice * cartItem.getQuantity();

            OrderDetail detail = OrderDetail.builder()
                    .order(order)
                    .productVariant(variant)
                    .quantity(cartItem.getQuantity())
                    .unitPrice(unitPrice)
                    .totalPrice(lineTotal)
                    .build();

            orderDetails.add(detail);
        }

        order.setOrderDetails(orderDetails);

        Order savedOrder = orderRepository.save(order);

        clearCartAfterCheckout(cart);

        sendOrderSuccessEmailSafely(savedOrder, currentUser);

        return toCheckoutResponse(savedOrder);
    }

    private long calculateSubtotal(Cart cart) {
        return cart.getItems()
                .stream()
                .mapToLong(item -> Math.round(item.getUnitPrice()) * item.getQuantity())
                .sum();
    }

    private void sendOrderSuccessEmailSafely(Order order, User currentUser) {
        try {
            String receiverEmail = normalizeBlank(order.getEmail());

            if (receiverEmail == null && currentUser != null) {
                receiverEmail = normalizeBlank(currentUser.getEmail());
            }

            orderMailService.sendOrderSuccessEmail(order, receiverEmail);
        } catch (Exception exception) {
            System.err.println("Đặt hàng thành công nhưng gửi email thất bại: "
                    + exception.getMessage());
        }
    }

    private void clearCartAfterCheckout(Cart cart) {
        cart.getItems().clear();
        cartRepository.save(cart);
    }

    private String buildFullAddress(String addressDetail, String wardName, String provinceName) {
        return String.join(", ",
                addressDetail.trim(),
                wardName,
                provinceName
        );
    }

    private PaymentMethod parsePaymentMethod(String value) {
        if (value == null || value.isBlank()) {
            return PaymentMethod.COD;
        }

        try {
            return PaymentMethod.valueOf(value.toUpperCase());
        } catch (Exception ex) {
            return PaymentMethod.COD;
        }
    }

    private String generateOrderCode() {
        return "NX" +
                LocalDateTime.now()
                        .toString()
                        .replace("-", "")
                        .replace(":", "")
                        .replace(".", "")
                        .replace("T", "")
                        .substring(0, 14)
                + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }

    private User getCurrentUserOrNull() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        if (authentication instanceof AnonymousAuthenticationToken) {
            return null;
        }

        String email = authentication.getName();

        if (email == null || email.isBlank() || "anonymousUser".equals(email)) {
            return null;
        }

        return userRepository.findByEmail(email).orElse(null);
    }

    private String normalizeBlank(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }

        return value.trim();
    }

    private CheckoutResponse toCheckoutResponse(Order order) {
        List<CheckoutItemResponse> items = order.getOrderDetails()
                .stream()
                .map(detail -> {
                    ProductVariant variant = detail.getProductVariant();
                    Product product = variant.getProduct();

                    return CheckoutItemResponse.builder()
                            .productId(product.getId())
                            .productName(product.getName())
                            .variantId(variant.getId())
                            .size(variant.getSize())
                            .quantity(detail.getQuantity())
                            .unitPrice(detail.getUnitPrice())
                            .totalPrice(detail.getTotalPrice())
                            .build();
                })
                .toList();

        return CheckoutResponse.builder()
                .orderId(order.getId())
                .orderCode(order.getCode())
                .subtotal(order.getSubtotal())
                .shipping(order.getShipping())
                .discount(order.getDiscount())
                .total(order.getTotal())
                .status(order.getStatus().name())
                .paymentMethod(order.getPaymentMethod().name())
                .paymentStatus(order.getPaymentStatus().name())
                .items(items)
                .build();
    }
}