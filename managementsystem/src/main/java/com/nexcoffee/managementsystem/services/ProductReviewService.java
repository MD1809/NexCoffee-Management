package com.nexcoffee.managementsystem.services;

import com.nexcoffee.managementsystem.dto.request.CreateReviewRequest;
import com.nexcoffee.managementsystem.dto.response.FeaturedReviewsResponse;
import com.nexcoffee.managementsystem.dto.response.ProductReviewResponse;
import com.nexcoffee.managementsystem.entities.*;
import com.nexcoffee.managementsystem.enums.OrderStatus;
import com.nexcoffee.managementsystem.enums.StoreStatus;
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

import java.time.LocalDateTime;
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
    private final StoreRepository storeRepository;

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

        LocalDateTime baseDate = order.getCompletedAt() != null ? order.getCompletedAt() : order.getCreatedAt();
        if (baseDate != null && baseDate.plusDays(7).isBefore(LocalDateTime.now())) {
            throw new InvalidOperationException("Đã quá thời hạn 7 ngày kể từ khi mua hàng để gửi đánh giá cho đơn hàng này.");
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
        return productReviewRepository.findByProductIdAndStatusInOrderByCreatedAtDesc(productId, List.of("ACTIVE", "HIDDEN")).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public FeaturedReviewsResponse getFeaturedReviews(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 20));
        List<ProductReview> reviews = productReviewRepository.findByStatusInAndRatingGreaterThanEqualOrderByCreatedAtDesc(
                List.of("ACTIVE", "HIDDEN"), 4, PageRequest.of(0, safeLimit)
        );

        // Fallback: nếu chưa đủ review 4-5 sao, lấy review mới nhất
        if (reviews.size() < safeLimit) {
            reviews = productReviewRepository.findByStatusInOrderByCreatedAtDesc(List.of("ACTIVE", "HIDDEN"), PageRequest.of(0, safeLimit));
        }

        List<ProductReviewResponse> responseList = reviews.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        Double overallAvg = productReviewRepository.getOverallAverageRating();
        long totalReviews = productReviewRepository.countPublicReviews();

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

    @Transactional(readOnly = true)
    public List<ProductReviewResponse> getAllReviews(Integer rating, int page, int size) {
        int safeSize = Math.max(1, Math.min(size, 100));
        PageRequest pageRequest = PageRequest.of(Math.max(0, page), safeSize);
        List<ProductReview> reviews;
        if (rating != null && rating >= 1 && rating <= 5) {
            reviews = productReviewRepository.findByStatusInAndRatingOrderByCreatedAtDesc(List.of("ACTIVE", "HIDDEN"), rating, pageRequest);
        } else {
            reviews = productReviewRepository.findByStatusInOrderByCreatedAtDesc(List.of("ACTIVE", "HIDDEN"), pageRequest);
        }
        return reviews.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProductReviewResponse updateReview(Integer reviewId, com.nexcoffee.managementsystem.dto.request.UpdateReviewRequest request) {
        User currentUser = getCurrentUser();
        ProductReview review = productReviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá với mã ID: " + reviewId));

        if (review.getUser() == null || !Objects.equals(review.getUser().getId(), currentUser.getId())) {
            throw new InvalidOperationException("Bạn chỉ có thể chỉnh sửa đánh giá do chính bạn tạo.");
        }

        if (Boolean.TRUE.equals(review.getIsEdited())) {
            throw new InvalidOperationException("Mỗi đánh giá chỉ được phép chỉnh sửa một lần duy nhất.");
        }

        Order order = review.getOrder();
        if (order != null) {
            LocalDateTime baseDate = order.getCompletedAt() != null ? order.getCompletedAt() : order.getCreatedAt();
            if (baseDate != null && baseDate.plusDays(7).isBefore(LocalDateTime.now())) {
                throw new InvalidOperationException("Đã quá thời hạn 7 ngày kể từ khi mua hàng để chỉnh sửa đánh giá.");
            }
        }

        review.setRating(request.getRating());
        review.setComment(request.getComment().trim());
        review.setIsEdited(true);
        review.setEditedAt(LocalDateTime.now());

        ProductReview updatedReview = productReviewRepository.save(review);

        // Cập nhật lại điểm trung bình của sản phẩm
        Product product = review.getProduct();
        if (product != null) {
            Double newAvgRating = productReviewRepository.getAverageRatingByProductId(product.getId());
            product.setAverageRating(Math.round(newAvgRating * 10.0) / 10.0);
            productRepository.save(product);
        }

        return mapToResponse(updatedReview);
    }

    @Transactional(readOnly = true)
    public List<ProductReviewResponse> getAdminReviews(Integer rating, String status, String keyword) {
        List<ProductReview> reviews = productReviewRepository.findAllByOrderByCreatedAtDesc();
        return reviews.stream()
                .filter(r -> {
                    if (rating != null && !Objects.equals(r.getRating(), rating)) return false;
                    if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status) && !Objects.equals(r.getStatus(), status)) return false;
                    if (keyword != null && !keyword.isBlank()) {
                        String k = keyword.trim().toLowerCase();
                        boolean matchProduct = r.getProduct() != null && r.getProduct().getName() != null && r.getProduct().getName().toLowerCase().contains(k);
                        boolean matchUser = r.getUser() != null && (
                                (r.getUser().getFullName() != null && r.getUser().getFullName().toLowerCase().contains(k)) ||
                                (r.getUser().getEmail() != null && r.getUser().getEmail().toLowerCase().contains(k))
                        );
                        boolean matchComment = r.getComment() != null && r.getComment().toLowerCase().contains(k);
                        return matchProduct || matchUser || matchComment;
                    }
                    return true;
                })
                .map(this::mapToAdminResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProductReviewResponse toggleReviewStatus(Integer id, String reason) {
        ProductReview review = productReviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá với ID: " + id));

        if ("HIDDEN".equalsIgnoreCase(review.getStatus())) {
            review.setStatus("ACTIVE");
            review.setHiddenReason(null);
        } else {
            review.setStatus("HIDDEN");
            review.setHiddenReason(reason != null && !reason.isBlank() ? reason.trim() : "Đánh giá có nội dung không phù hợp");
        }

        ProductReview saved = productReviewRepository.save(review);

        // Tính lại điểm trung bình cho sản phẩm (tính các review công khai ACTIVE và HIDDEN)
        Product product = saved.getProduct();
        if (product != null) {
            Double newAvgRating = productReviewRepository.getAverageRatingByProductId(product.getId());
            long count = productReviewRepository.countPublicReviewsByProductId(product.getId());
            product.setAverageRating(newAvgRating != null ? Math.round(newAvgRating * 10.0) / 10.0 : 5.0);
            product.setReviewCount((int) count);
            productRepository.save(product);
        }

        return mapToAdminResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ProductReviewResponse> getUserReviews(Long userId) {
        return productReviewRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToAdminResponse)
                .collect(Collectors.toList());
    }

    public ProductReviewResponse mapToAdminResponse(ProductReview review) {
        ProductReviewResponse res = mapToResponse(review);
        // Với admin, hiển thị tên thật không che và nội dung gốc
        if (review.getUser() != null && review.getUser().getFullName() != null) {
            res.setUserFullName(review.getUser().getFullName());
        }
        res.setRawComment(review.getComment());
        return res;
    }

    public ProductReviewResponse mapToResponse(ProductReview review) {
        Product product = review.getProduct();
        User user = review.getUser();

        String mainImage = "";
        if (product != null && product.getImages() != null && !product.getImages().isEmpty()) {
            ProductImage mainImg = product.getImages().stream()
                    .filter(img -> Boolean.TRUE.equals(img.getIsMain()))
                    .findFirst()
                    .orElse(product.getImages().get(0));
            mainImage = mainImg.getImageUrl();
        }

        String displayName = "Khách hàng NexCoffee";
        if (user != null) {
            if (user.getFullName() != null && !user.getFullName().isBlank()) {
                displayName = maskFullName(user.getFullName().trim());
            } else if (user.getEmail() != null) {
                displayName = maskEmail(user.getEmail());
            }
        }

        String storeName = "NexCoffee";
        if (review.getOrder() != null) {
            Long nearestStoreId = review.getOrder().getNearestStoreId();
            if (nearestStoreId != null) {
                storeName = storeRepository.findById(nearestStoreId)
                        .map(Store::getName)
                        .orElse("NexCoffee");
            } else {
                storeName = storeRepository.findFirstByStatusOrderByCreatedAtAsc(StoreStatus.ACTIVE)
                        .map(Store::getName)
                        .orElse("NexCoffee");
            }
        }

        boolean isHidden = "HIDDEN".equalsIgnoreCase(review.getStatus());
        String displayComment = review.getComment();
        if (isHidden) {
            // Khi ẩn, nội dung hiển thị cho công chúng chính là lý do ẩn
            displayComment = (review.getHiddenReason() != null && !review.getHiddenReason().trim().isEmpty())
                    ? review.getHiddenReason().trim()
                    : "Đánh giá có nội dung không phù hợp";
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
                .comment(displayComment)
                .rawComment(review.getComment())
                .status(review.getStatus())
                .hiddenReason(review.getHiddenReason())
                .isContentHidden(isHidden)
                .createdAt(review.getCreatedAt())
                .orderId(review.getOrder() != null ? review.getOrder().getId() : null)
                .orderCode(review.getOrder() != null ? review.getOrder().getCode() : null)
                .orderCreatedAt(review.getOrder() != null ? review.getOrder().getCreatedAt() : null)
                .storeName(storeName)
                .verifiedPurchase(true)
                .isEdited(Boolean.TRUE.equals(review.getIsEdited()))
                .editedAt(review.getEditedAt())
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
