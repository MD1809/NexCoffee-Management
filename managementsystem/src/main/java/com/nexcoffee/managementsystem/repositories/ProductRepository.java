package com.nexcoffee.managementsystem.repositories;

import com.nexcoffee.managementsystem.entities.Product;
import com.nexcoffee.managementsystem.enums.ProductsStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {
    List<Product> findByStatus(ProductsStatus status);
    List<Product> findByStatusNot(ProductsStatus status);
    List<Product> findByStatusOrderByIdDesc(ProductsStatus status);
}
