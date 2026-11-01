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
    List<Product> findTop4ByStatusAndDeletedFalseOrderBySoldCountDescIdDesc(ProductsStatus status);
    boolean existsByNameAndCategoryIdAndDeletedFalse(String name, Integer categoryId);
    boolean existsByNameAndCategoryIdAndIdNotAndDeletedFalse(String name, Integer categoryId, Integer id);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query(value = "UPDATE products p " +
            "SET p.sold_count = COALESCE((" +
            "    SELECT SUM(od.quantity) " +
            "    FROM order_details od " +
            "    JOIN orders o ON od.order_id = o.id AND o.status = 'Completed' " +
            "    JOIN product_variants pv ON od.product_variant_id = pv.id " +
            "    WHERE pv.product_id = p.id" +
            "), 0), " +
            "p.average_rating = COALESCE(p.average_rating, 5.0), " +
            "p.review_count = COALESCE(p.review_count, 0)", nativeQuery = true)
    int syncHistoricalSoldCount();
}
