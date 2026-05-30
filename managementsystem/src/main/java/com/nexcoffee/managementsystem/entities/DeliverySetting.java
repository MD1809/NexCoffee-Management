package com.nexcoffee.managementsystem.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "delivery_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliverySetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "max_distance_km", nullable = false)
    private Double maxDistanceKm;

    @Column(name = "free_ship_min_order", nullable = false)
    private Long freeShipMinOrder;

    @Column(name = "shipping_fee", nullable = false)
    private Long shippingFee;

    @Column(nullable = false)
    private Boolean active;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();

        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}