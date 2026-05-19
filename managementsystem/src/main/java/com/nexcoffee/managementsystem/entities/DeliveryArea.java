package com.nexcoffee.managementsystem.entities;

import com.nexcoffee.managementsystem.enums.DeliveryAreaStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "delivery_areas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryArea {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "area_key", nullable = false, unique = true, length = 80)
    private String areaKey;

    @Column(name = "province_code", nullable = false, length = 20)
    private String provinceCode;

    @Column(name = "ward_code", length = 20)
    private String wardCode;

    @Column(name = "shipping_fee", nullable = false)
    private Double shippingFee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DeliveryAreaStatus status;

    @Column(length = 255)
    private String note;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();

        if (shippingFee == null) {
            shippingFee = 0.0;
        }

        if (status == null) {
            status = DeliveryAreaStatus.ACTIVE;
        }

        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}