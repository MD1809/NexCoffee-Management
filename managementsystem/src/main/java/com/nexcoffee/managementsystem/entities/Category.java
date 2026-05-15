package com.nexcoffee.managementsystem.entities;

import com.nexcoffee.managementsystem.enums.CategoryStatus;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@Table(name = "categories")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private String name;
    private String description;

    @Column(name = "product_count")
    private Integer productCount = 0;

    @Column(name ="status")
    @Enumerated(EnumType.STRING)
    private CategoryStatus categoryStatus;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "category")
    private List<Product> products;
}
