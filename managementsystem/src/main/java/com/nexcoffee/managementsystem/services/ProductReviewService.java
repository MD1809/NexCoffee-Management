package com.nexcoffee.managementsystem.services;

import com.nexcoffee.managementsystem.dto.request.CreateReviewRequest;
import com.nexcoffee.managementsystem.dto.response.FeaturedReviewsResponse;
import com.nexcoffee.managementsystem.dto.response.ProductReviewResponse;
import com.nexcoffee.managementsystem.entities.*;
import com.nexcoffee.managementsystem.enums.OrderStatus;
import com.nexcoffee.managementsystem.exceptions.InvalidOperationException;
import com.nexcoffee.managementsystem.exceptions.ResourceNotFoundException;
import com.nexcoffee.managementsystem.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductReviewService {

    private final ProductReviewRepository productReviewRepository;
    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final UserRepository userRepository;

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication instanceof AnonymousAuthenticationToken) {
            throw new InvalidOperationException("Bạn cần đăng nhập để thực hiện thao tác này.");
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng."));
    }

    @Transactional
    public ProductReviewResponse createReview(CreateReviewRequest request) {
        User currentUser = getCurrentUser();
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với mã ID: " + request.getOrderId()));

        if (order.getUser() == null || !Objects.equals(order.getUser().getId(), currentUser.getId())) {
            throw new InvalidOperationException("Bạn chỉ có thể đánh giá các đơn hàng do chính bạn đặt.");
        }

        if (order.getStatus() != OrderStatus.Completed) {
            throw new InvalidOperationException("Chỉ có thể đánh giá sản phẩm sau khi đơn hàng đã hoàn tất giao thành công.");
        }

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với mã ID: " + request.getProductId()));

        List<OrderDetail> orderDetails = orderDetailRepository.findByOrderId(order.getId());
        boolean hasProductInOrder = orderDetails.stream().anyMatch(od ->
                od.getProductVariant() != null &&
                od.getProductVariant().getProduct() != null &&
                Objects.equals(od.getProductVariant().getProduct().getId(), product.getId())
        );

        if (!hasProductInOrder) {
            throw new InvalidOperationException("Sản phẩm này không nằm trong đơn hàng đã mua của bạn.");
        }

        if (productReviewRepository.existsByOrderIdAndProductId(order.getId(), product.getId())) {
            throw new InvalidOperationException("Bạn đã đánh giá món ăn này cho đơn hàng này rồi.");
        }

        ProductVariant variant = null;
        if (request.getProductVariantId() != null) {
            variant = productVariantRepository.findById(request.getProductVariantId()).orElse(null);
        }
        if (variant == null) {
            variant = orderDetails.stream()
                    .filter(od -> od.getProductVariant() != null &&
                            od.getProductVariant().getProduct() != null &&
                            Objects.equals(od.getProductVariant().getProduct().getId(), product.getId()))
                    .map(OrderDetail::getProductVariant)
                    .findFirst()
                    .orElse(null);
        }

        ProductReview review = ProductReview.builder()
                .user(currentUser)
                .order(order)
                .product(product)
                .productVariant(variant)
                .rating(request.getRating())
                .comment(request.getComment().trim())
                .status("ACTIVE")
                .build();

        ProductReview savedReview = productReviewRepository.save(review);

        // Cập nhật điểm trung bình và số lượt đánh giá của sản phẩm
        Double newAvgRating = productReviewRepository.getAverageRatingByProductId(product.getId());
        long newReviewCount = productReviewRepository.countByProductIdAndStatus(product.getId(), "ACTIVE");

        product.setAverageRating(Math.round(newAvgRating * 10.0) / 10.0);
        product.setReviewCount((int) newReviewCount);
        productRepository.save(product);

        return mapToResponse(savedReview);
    }

    @Transactional(readOnly = true)
    public List<ProductReviewResponse> getReviewsByOrderId(Integer orderId) {
        User currentUser = getCurrentUser();
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng."));

        if (order.getUser() == null || !Objects.equals(order.getUser().getId(), currentUser.getId())) {
            throw new InvalidOperationException("Bạn không có quyền xem đánh giá của đơn hàng này.");
        }

        return productReviewRepository.findByOrderId(orderId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductReviewResponse> getReviewsByProductId(Integer productId) {
        return productReviewRepository.findByProductIdAndStatusOrderByCreatedAtDesc(productId, "ACTIVE").stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public FeaturedReviewsResponse getFeaturedReviews(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 20));
        List<ProductReview> reviews = productReviewRepository.findByStatusAndRatingGreaterThanEqualOrderByCreatedAtDesc(
                "ACTIVE", 4, PageRequest.of(0, safeLimit)
        );

        // Fallback: nếu chưa đủ review 4-5 sao, lấy review ACTIVE mới nhất
        if (reviews.size() < safeLimit) {
            reviews = productReviewRepository.findByStatusOrderByCreatedAtDesc("ACTIVE", PageRequest.of(0, safeLimit));
        }

        List<ProductReviewResponse> responseList = reviews.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        Double overallAvg = productReviewRepository.getOverallAverageRating();
        long totalReviews = productReviewRepository.countByStatus("ACTIVE");

        // Tỉ lệ hài lòng mặc định hoặc tính theo review >= 4 sao
        double satisfactionRate = totalReviews > 0 ? 98.8 : 100.0;
        if (totalReviews > 0) {
            long highRatingCount = reviews.stream().filter(r -> r.getRating() >= 4).count();
            if (!reviews.isEmpty()) {
                satisfactionRate = Math.round(((double) highRatingCount / reviews.size() * 100.0) * 10.0) / 10.0;
            }
        }

        return FeaturedReviewsResponse.builder()
                .reviews(responseList)
                .averageRating(Math.round(overallAvg * 10.0) / 10.0)
                .totalReviews(totalReviews)
                .satisfactionRate(satisfactionRate)
                .build();
    }

    private ProductReviewResponse mapToResponse(ProductReview review) {
        Product product = review.getProduct();
        User user = review.getUser();

        String mainImage = "";
        if (product != null && product.getImages() != null && !product.getImages().isEmpty()) {
            mainImage = product.getImages().get(0).getImageUrl();
        }

        String displayName = "Khách hàng NexCoffee";
        if (user != null) {
            if (user.getFullName() != null && !user.getFullName().isBlank()) {
                displayName = maskFullName(user.getFullName().trim());
            } else if (user.getEmail() != null) {
                displayName = maskEmail(user.getEmail());
            }
        }

        return ProductReviewResponse.builder()
                .id(review.getId())
                .productId(product != null ? product.getId() : null)
                .productName(product != null ? product.getName() : "Sản phẩm NexCoffee")
                .productImage(mainImage)
                .categoryName(product != null && product.getCategory() != null ? product.getCategory().getName() : "Đồ uống")
                .variantSize(review.getProductVariant() != null ? review.getProductVariant().getSize() : null)
                .userId(user != null ? user.getId() : null)
                .userFullName(displayName)
                .userAvatar(null)
                .rating(review.getRating())
                .comment(review.getComment())
                .status(review.getStatus())
                .createdAt(review.getCreatedAt())
                .orderId(review.getOrder() != null ? review.getOrder().getId() : null)
                .orderCode(review.getOrder() != null ? review.getOrder().getCode() : null)
                .verifiedPurchase(true)
                .build();
    }

    private String maskFullName(String name) {
        String[] words = name.split("\\s+");
        if (words.length <= 1) return name;
        if (words.length == 2) return words[0] + " " + words[1].charAt(0) + "***";
        return words[0] + " " + words[1].charAt(0) + "*** " + words[words.length - 1];
    }

    private String maskEmail(String email) {
        int atIndex = email.indexOf("@");
        if (atIndex <= 2) return email;
        return email.substring(0, 2) + "***" + email.substring(atIndex);
    }
}
