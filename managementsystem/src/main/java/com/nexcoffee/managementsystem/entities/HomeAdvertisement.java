package com.nexcoffee.managementsystem.entities;

import com.nexcoffee.managementsystem.enums.AdvertisementTargetType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "home_advertisements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HomeAdvertisement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 30)
    private AdvertisementTargetType targetType;

    @Column(name = "target_id")
    private Long targetId;

    @Column(name = "target_url", length = 500)
    private String targetUrl;

    @Column(nullable = false)
    private Boolean active;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();

        if (targetType == null) {
            targetType = AdvertisementTargetType.NONE;
        }

        if (active == null) {
            active = false;
        }

        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}