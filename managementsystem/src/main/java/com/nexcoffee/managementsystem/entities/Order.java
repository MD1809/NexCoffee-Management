package com.nexcoffee.managementsystem.entities;

import com.nexcoffee.managementsystem.enums.OrderStatus;
import com.nexcoffee.managementsystem.enums.PaymentMethod;
import com.nexcoffee.managementsystem.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Khách hàng đặt đơn
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    // Nhân viên chốt đơn / thu ngân
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id")
    private User staff;

    // Nhân viên giao hàng
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shipper_id")
    private User shipper;

    @Column(unique = true, nullable = false, length = 32)
    private String code;

    @Column(name = "full_name", nullable = false, length = 120)
    private String fullName;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(length = 120)
    private String email;

    @Column(length = 500)
    private String address;

    @Column(nullable = false)
    private Long subtotal = 0L;

    @Column(nullable = false)
    private Long shipping = 0L;

    @Column(nullable = false)
    private Long discount = 0L;

    @Column(nullable = false)
    private Long total = 0L;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false)
    private PaymentMethod paymentMethod = PaymentMethod.COD;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.unpaid;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.Pending;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "cancel_reason")
    private String cancelReason;

    // Thời điểm khách thanh toán xong (dùng để tính doanh thu ngày)
    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    // Thời điểm đơn hàng hoàn tất
    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    // Thời điểm xác nhận đơn / bắt đầu pha chế
    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    // Thời điểm bắt đầu giao hàng (shipper lấy hàng đi)
    @Column(name = "shipped_at")
    private LocalDateTime shippedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderDetail> orderDetails;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}