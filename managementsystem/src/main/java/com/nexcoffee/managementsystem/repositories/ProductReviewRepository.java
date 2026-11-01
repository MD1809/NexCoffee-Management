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

    List<ProductReview> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<ProductReview> findAllByOrderByCreatedAtDesc();

    List<ProductReview> findByProductIdAndStatusOrderByCreatedAtDesc(Integer productId, String status);

    List<ProductReview> findByProductIdAndStatusInOrderByCreatedAtDesc(Integer productId, java.util.Collection<String> statuses);

    List<ProductReview> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    List<ProductReview> findByStatusInOrderByCreatedAtDesc(java.util.Collection<String> statuses, Pageable pageable);

    List<ProductReview> findByStatusAndRatingOrderByCreatedAtDesc(String status, Integer rating, Pageable pageable);

    List<ProductReview> findByStatusInAndRatingOrderByCreatedAtDesc(java.util.Collection<String> statuses, Integer rating, Pageable pageable);

    List<ProductReview> findByStatusAndRatingGreaterThanEqualOrderByCreatedAtDesc(String status, Integer minRating, Pageable pageable);

    List<ProductReview> findByStatusInAndRatingGreaterThanEqualOrderByCreatedAtDesc(java.util.Collection<String> statuses, Integer minRating, Pageable pageable);

    @Query("SELECT COALESCE(AVG(r.rating), 5.0) FROM ProductReview r WHERE r.product.id = :productId AND r.status IN ('ACTIVE', 'HIDDEN')")
    Double getAverageRatingByProductId(@Param("productId") Integer productId);

    long countByProductIdAndStatus(Integer productId, String status);

    @Query("SELECT COUNT(r) FROM ProductReview r WHERE r.product.id = :productId AND r.status IN ('ACTIVE', 'HIDDEN')")
    long countPublicReviewsByProductId(@Param("productId") Integer productId);

    @Query("SELECT COALESCE(AVG(r.rating), 5.0) FROM ProductReview r WHERE r.status IN ('ACTIVE', 'HIDDEN')")
    Double getOverallAverageRating();

    long countByStatus(String status);

    @Query("SELECT COUNT(r) FROM ProductReview r WHERE r.status IN ('ACTIVE', 'HIDDEN')")
    long countPublicReviews();
}
