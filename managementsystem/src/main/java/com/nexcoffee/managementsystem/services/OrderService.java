package com.nexcoffee.managementsystem.services;

import com.nexcoffee.managementsystem.dto.request.OrderRequest;
import com.nexcoffee.managementsystem.entities.Order;
import com.nexcoffee.managementsystem.entities.OrderDetail;
import com.nexcoffee.managementsystem.entities.ProductVariant;
import com.nexcoffee.managementsystem.entities.User;
import com.nexcoffee.managementsystem.enums.OrderStatus;
import com.nexcoffee.managementsystem.enums.PaymentStatus;
import com.nexcoffee.managementsystem.exceptions.ResourceNotFoundException;
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
    private final EmailService emailService;

    // --- PHẦN 1: CÁC HÀM MỚI PHỤC VỤ DASHBOARD THỐNG KÊ ---

    public Long getRevenueByDate(LocalDate date) {
        LocalDateTime startOfDay = getStartOfDay(date);
        LocalDateTime endOfDay = getEndOfDay(date);
        return orderRepository.calculateRevenueByDate(startOfDay, endOfDay, PaymentStatus.paid);
    }

    public List<OrderDetailRepository.ProductSaleStats> getProductSalesStatsByDate(LocalDate date) {
        LocalDateTime startOfDay = getStartOfDay(date);
        LocalDateTime endOfDay = getEndOfDay(date);
        return orderDetailRepository.getProductSalesByDate(startOfDay, endOfDay, OrderStatus.Completed);
    }

    // Lấy danh sách đơn hàng chi tiết phục vụ trang quản lý (kèm staff/shipper)
    public List<Order> getOrdersWithStaffInfoByDate(LocalDate date) {
        LocalDateTime startOfDay = getStartOfDay(date);
        LocalDateTime endOfDay = getEndOfDay(date);
        return orderRepository.findOrdersWithStaffAndShipperByDate(startOfDay, endOfDay);
    }

    // Helper method: Lấy giờ bắt đầu của ngày
    private LocalDateTime getStartOfDay(LocalDate date) {
        if (date == null) date = LocalDate.now();
        return date.atStartOfDay();
    }

    // Helper method: Lấy giờ kết thúc của ngày
    private LocalDateTime getEndOfDay(LocalDate date) {
        if (date == null) date = LocalDate.now();
        return date.atTime(LocalTime.MAX);
    }


    // --- PHẦN 2: CÁC HÀM LUỒNG NGHIỆP VỤ (ĐÃ ĐƯỢC CẬP NHẬT) ---

    // Lấy danh sách đơn hàng hôm nay (Giữ nguyên)
    public List<Order> getOrdersToday() {
        LocalDateTime startOfDay = LocalDateTime.now().with(LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.now().with(LocalTime.MAX);
        return orderRepository.findByCreatedAtBetween(startOfDay, endOfDay);
    }

    // Lấy danh sách tất cả đơn hàng (Giữ nguyên)
    public List<Order> getAllOrders(LocalDate filterDate) {
        if (filterDate == null) {
            return orderRepository.findAll();
        }
        LocalDateTime startOfDay = filterDate.atStartOfDay();
        LocalDateTime endOfDay = filterDate.atTime(LocalTime.MAX);
        return orderRepository.findByCreatedAtBetween(startOfDay, endOfDay);
    }

    // Lấy đơn hàng chi tiết qua id (Giữ nguyên)
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

        // BỔ SUNG: Ánh xạ Staff (nhân viên chốt đơn) nếu có truyền lên
        User staff = null;
        if (request.getStaffId() != null) {
            staff = userRepository.findById(request.getStaffId())
                    .orElseThrow(() -> new RuntimeException("Staff not found"));
        }

        Order order = Order.builder()
                .user(user)
                .staff(staff) // Lưu người tạo đơn
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

    // 1. HÀM CŨ (Giữ nguyên tương thích)
    @Transactional
    public Order updateOrderStatus(Integer orderId, OrderStatus newStatus, String cancelReason) {
        return updateOrderStatus(orderId, newStatus, cancelReason, null, null);
    }

    // 2. HÀM MỚI (Cập nhật thêm tham số staffId)
    @Transactional
    public Order updateOrderStatus(Integer orderId, OrderStatus newStatus, String cancelReason, Integer shipperId, Integer staffId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với id: " + orderId));

        if (newStatus == OrderStatus.Cancelled) {
            if (order.getStatus() == OrderStatus.Shipped || order.getStatus() == OrderStatus.Completed) {
                throw new IllegalStateException("Không thể hủy đơn hàng đang giao hoặc đã hoàn thành.");
            }
            order.setCancelReason(cancelReason);
        }

        if (staffId != null && order.getStaff() == null) {
            User staff = userRepository.findById(Long.valueOf(staffId))
                    .orElseThrow(() -> new RuntimeException("Staff not found"));
            order.setStaff(staff);
        }

        if (newStatus == OrderStatus.Processing && order.getProcessedAt() == null) {
            order.setProcessedAt(LocalDateTime.now());
        }

        if (newStatus == OrderStatus.Shipped) {
            if (shipperId != null) {
                User shipper = userRepository.findById(Long.valueOf(shipperId))
                        .orElseThrow(() -> new RuntimeException("Shipper not found"));
                order.setShipper(shipper);
            }

            if (order.getShippedAt() == null) {
                order.setShippedAt(LocalDateTime.now());
            }
        }

        if (newStatus == OrderStatus.Completed && order.getCompletedAt() == null) {
            order.setCompletedAt(LocalDateTime.now());

            // Logic tự động cập nhật thanh toán khi giao hàng thành công
            if (order.getPaymentStatus() == PaymentStatus.unpaid) {
                order.setPaymentStatus(PaymentStatus.paid);
                order.setPaidAt(LocalDateTime.now());
            }
        }

        order.setStatus(newStatus);
        Order savedOrder = orderRepository.save(order);

        if ((newStatus == OrderStatus.Shipped || newStatus == OrderStatus.Completed || newStatus == OrderStatus.Cancelled)
                && savedOrder.getEmail() != null
                && !savedOrder.getEmail().trim().isEmpty()) {

            // Xác định nhãn trạng thái dựa trên newStatus
            String statusLabel;
            if (newStatus == OrderStatus.Shipped) {
                statusLabel = "ĐƠN HÀNG ĐANG ĐƯỢC GIAO";
            } else if (newStatus == OrderStatus.Completed) {
                statusLabel = "ĐÃ GIAO HÀNG THÀNH CÔNG";
            } else {
                // Trạng thái Hủy - Kèm theo lý do nếu có
                statusLabel = "ĐƠN HÀNG ĐÃ BỊ HỦY";
                if (cancelReason != null && !cancelReason.trim().isEmpty()) {
                    statusLabel += "<br/><span style='font-size:14px; color:#ef4444; font-weight:normal;'>Lý do: " + cancelReason + "</span>";
                }
            }

            // BẠN ĐÃ THIẾU ĐOẠN NÀY DẪN ĐẾN VIỆC KHÔNG GỬI ĐƯỢC MAIL
            // Gọi service để thực sự gửi email đi
            emailService.sendOrderStatusEmail(
                    savedOrder.getEmail(),
                    savedOrder.getFullName(),
                    savedOrder.getCode(),
                    newStatus.name(),
                    cancelReason
            );
        }

        return savedOrder;
    }

    @Transactional
    public Order updatePaymentStatus(Integer orderId, PaymentStatus newPaymentStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng với id: " + orderId));

        order.setPaymentStatus(newPaymentStatus);

        if (newPaymentStatus == PaymentStatus.paid && order.getPaidAt() == null) {
            order.setPaidAt(LocalDateTime.now());
        }

        return orderRepository.save(order);
    }

    // --- PHẦN 3: XỬ LÝ ĐƠN HÀNG TẠI QUẦY (POS) ---

    @Transactional
    public Order createPosOrder(com.nexcoffee.managementsystem.dto.request.posOrder.OrderPosRequest request) {

        // 1. Lấy thông tin nhân viên thu ngân (nếu có truyền lên)
        User staff = null;
        if (request.getStaffId() != null) {
            staff = userRepository.findById(Long.valueOf(request.getStaffId()))
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin nhân viên thu ngân"));
        }

        // 2. Tạo đơn hàng mới. Đặc thù của POS là mặc định khách mua tại quầy.
        Order order = Order.builder()
                .staff(staff)
                .code(generateUniqueOrderCode())
                .fullName("Khách lẻ (Tại quầy)")
                .shipping(request.getShipping() != null ? request.getShipping().longValue() : 0L)
                .discount(request.getDiscount() != null ? request.getDiscount().longValue() : 0L)
                .paymentMethod(com.nexcoffee.managementsystem.enums.PaymentMethod.valueOf(request.getPaymentMethod()))
                .paymentStatus(PaymentStatus.paid)
                .status(OrderStatus.Completed)
                .paidAt(LocalDateTime.now())
                .completedAt(LocalDateTime.now())
                .subtotal(request.getSubtotal().longValue())
                .total(request.getTotal().longValue())
                .build();

        Order savedOrder = orderRepository.save(order);

        // 3. Xử lý lưu chi tiết đơn hàng (OrderDetails)
        List<OrderDetail> orderDetails = new ArrayList<>();
        long calculatedSubtotal = 0L;

        for (com.nexcoffee.managementsystem.dto.request.posOrder.OrderItemPosRequest item : request.getItems()) {
            ProductVariant variant = productVariantRepository.findById(item.getProductVariantId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy biến thể sản phẩm có ID: " + item.getProductVariantId()));

            long dbUnitPrice = variant.getPrice().longValue();
            long totalPrice = dbUnitPrice * item.getQuantity();
            calculatedSubtotal += totalPrice;

            OrderDetail detail = OrderDetail.builder()
                    .order(savedOrder)
                    .productVariant(variant)
                    .quantity(item.getQuantity())
                    .unitPrice(dbUnitPrice)
                    .totalPrice(totalPrice)
                    .build();

            orderDetails.add(detail);
        }

        if (calculatedSubtotal != request.getSubtotal().longValue()) {
            throw new RuntimeException("Lỗi dữ liệu: Tổng tiền giỏ hàng không khớp với hệ thống!");
        }

        orderDetailRepository.saveAll(orderDetails);
        savedOrder.setOrderDetails(orderDetails);

        return savedOrder;
    }

    private String generateUniqueOrderCode() {
        String uuid = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        return "NEX-" + uuid;
    }
}