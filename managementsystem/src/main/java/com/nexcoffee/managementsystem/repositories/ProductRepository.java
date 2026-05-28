package com.nexcoffee.managementsystem.repositories;

import com.nexcoffee.managementsystem.entities.Product;
import com.nexcoffee.managementsystem.enums.ProductsStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {
    List<Product> findByDeletedFalseOrderByIdDesc();
    List<Product> findByDeletedTrueOrderByIdDesc();
    List<Product> findByCategoryId(Integer categoryId);
    List<Product> findByCategoryIdAndDeletedFalse(Integer categoryId);
    List<Product> findByStatusAndDeletedFalseOrderByIdDesc(ProductsStatus status);
    boolean existsByNameAndCategoryIdAndDeletedFalse(String name, Integer categoryId);
    boolean existsByNameAndCategoryIdAndIdNotAndDeletedFalse(String name, Integer categoryId, Integer id);
}
