package com.nexcoffee.managementsystem.repositories;

import com.nexcoffee.managementsystem.entities.ProductReview;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductReviewRepository extends JpaRepository<ProductReview, Integer> {

    boolean existsByOrderIdAndProductId(Integer orderId, Integer productId);

    List<ProductReview> findByOrderId(Integer orderId);

    List<ProductReview> findByProductIdAndStatusOrderByCreatedAtDesc(Integer productId, String status);

    List<ProductReview> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    List<ProductReview> findByStatusAndRatingGreaterThanEqualOrderByCreatedAtDesc(String status, Integer minRating, Pageable pageable);

    @Query("SELECT COALESCE(AVG(r.rating), 5.0) FROM ProductReview r WHERE r.product.id = :productId AND r.status = 'ACTIVE'")
    Double getAverageRatingByProductId(@Param("productId") Integer productId);

    long countByProductIdAndStatus(Integer productId, String status);

    @Query("SELECT COALESCE(AVG(r.rating), 5.0) FROM ProductReview r WHERE r.status = 'ACTIVE'")
    Double getOverallAverageRating();

    long countByStatus(String status);
}
