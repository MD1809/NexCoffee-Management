package com.nexcoffee.managementsystem.services;

import com.nexcoffee.managementsystem.dto.response.CustomerDetailResponse;
import com.nexcoffee.managementsystem.dto.response.ProductReviewResponse;
import com.nexcoffee.managementsystem.dto.response.StaffPerformanceResponse;
import com.nexcoffee.managementsystem.dto.response.UserResponse;
import java.util.Map;
import java.util.HashMap;
import com.nexcoffee.managementsystem.entities.Order;
import com.nexcoffee.managementsystem.entities.Store;
import com.nexcoffee.managementsystem.entities.User;
import com.nexcoffee.managementsystem.enums.OrderStatus;
import com.nexcoffee.managementsystem.enums.Role;
import com.nexcoffee.managementsystem.exceptions.InvalidOperationException;
import com.nexcoffee.managementsystem.exceptions.ResourceNotFoundException;
import com.nexcoffee.managementsystem.repositories.OrderRepository;
import com.nexcoffee.managementsystem.repositories.StoreRepository;
import com.nexcoffee.managementsystem.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final Set<Role> STORE_REQUIRED_ROLES =
            Set.of(Role.ADMIN, Role.STAFF, Role.SHIPPER);

    private static final Set<Role> ADMIN_MANAGED_ROLES =
            Set.of(Role.STAFF, Role.SHIPPER);

    private final UserRepository userRepository;
    private final StoreRepository storeRepository;
    private final PasswordEncoder passwordEncoder;
    private final OrderRepository orderRepository;
    private final ProductReviewService productReviewService;

    public List<UserResponse> getAllUsers() {
        User currentUser = getCurrentUser();

        if (currentUser.getRole() == Role.SUPER_ADMIN) {
            return userRepository.findAll()
                    .stream()
                    .map(this::mapToUserResponse)
                    .collect(Collectors.toList());
        }

        if (currentUser.getRole() == Role.ADMIN) {
            Long storeId = getCurrentUserStoreIdOrThrow(currentUser);

            return userRepository.findByStoreIdAndRoleIn(storeId, ADMIN_MANAGED_ROLES)
                    .stream()
                    .map(this::mapToUserResponse)
                    .collect(Collectors.toList());
        }

        throw new InvalidOperationException("Bạn không có quyền quản lý tài khoản.");
    }

    public UserResponse getUserById(Long id) {
        User currentUser = getCurrentUser();

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));

        ensureCanManageUser(currentUser, user);

        return mapToUserResponse(user);
    }

    public List<UserResponse> getActiveShippers() {
        User currentUser = getCurrentUser();

        List<User> shippers;

        if (currentUser.getRole() == Role.SUPER_ADMIN) {
            shippers = userRepository.findByRoleAndStatus(Role.SHIPPER, "ACTIVE");
        } else {
            Long storeId = getCurrentUserStoreIdOrThrow(currentUser);

            shippers = userRepository.findByRoleAndStatusAndStoreId(
                    Role.SHIPPER,
                    "ACTIVE",
                    storeId
            );
        }

        if (shippers.isEmpty()) {
            throw new ResourceNotFoundException("Hiện tại không có nhân viên giao hàng nào đang hoạt động!");
        }

        return shippers.stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserResponse createUser(User userRequest) {
        User currentUser = getCurrentUser();

        if (userRepository.findByEmail(userRequest.getEmail()).isPresent()) {
            throw new InvalidOperationException("Email này đã được sử dụng!");
        }

        if (userRepository.findByPhone(userRequest.getPhone()).isPresent()) {
            throw new InvalidOperationException("Số điện thoại đã được sử dụng!");
        }

        if (userRequest.getPassword() == null || userRequest.getPassword().isBlank()) {
            throw new InvalidOperationException("Mật khẩu không được để trống.");
        }

        Role targetRole = userRequest.getRole() == null
                ? Role.CUSTOMER
                : userRequest.getRole();

        Store targetStore = resolveTargetStore(currentUser, targetRole, userRequest.getStore());

        userRequest.setRole(targetRole);
        userRequest.setStore(targetStore);
        userRequest.setPassword(passwordEncoder.encode(userRequest.getPassword()));
        userRequest.setVerified(true);

        if (userRequest.getStatus() == null || userRequest.getStatus().isBlank()) {
            userRequest.setStatus("ACTIVE");
        }

        User savedUser = userRepository.save(userRequest);

        return mapToUserResponse(savedUser);
    }

    @Transactional
    public UserResponse updateUser(Long id, User userDetails) {
        User currentUser = getCurrentUser();

        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));

        ensureCanManageUser(currentUser, existingUser);

        userRepository.findByEmail(userDetails.getEmail()).ifPresent(userWithEmail -> {
            if (!userWithEmail.getId().equals(id)) {
                throw new InvalidOperationException("Email này đã được tài khoản khác sử dụng!");
            }
        });

        userRepository.findByPhone(userDetails.getPhone()).ifPresent(userWithPhone -> {
            if (!userWithPhone.getId().equals(id)) {
                throw new InvalidOperationException("Số điện thoại này đã được tài khoản khác sử dụng!");
            }
        });

        Role targetRole = userDetails.getRole() == null
                ? existingUser.getRole()
                : userDetails.getRole();

        Store targetStore = resolveTargetStore(currentUser, targetRole, userDetails.getStore());

        existingUser.setFullName(userDetails.getFullName());
        existingUser.setEmail(userDetails.getEmail());
        existingUser.setPhone(userDetails.getPhone());
        existingUser.setRole(targetRole);
        existingUser.setStatus(userDetails.getStatus());
        existingUser.setStore(targetStore);

        if (userDetails.getPassword() != null && !userDetails.getPassword().isBlank()) {
            existingUser.setPassword(passwordEncoder.encode(userDetails.getPassword()));
        }

        User updatedUser = userRepository.save(existingUser);

        return mapToUserResponse(updatedUser);
    }

    @Transactional
    public void deleteUser(Long id) {
        User currentUser = getCurrentUser();

        User targetUser = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại để xóa!"));

        ensureCanManageUser(currentUser, targetUser);

        userRepository.delete(targetUser);
    }

    private Store resolveTargetStore(User currentUser, Role targetRole, Store requestStore) {
        if (currentUser.getRole() == Role.SUPER_ADMIN) {
            if (STORE_REQUIRED_ROLES.contains(targetRole)) {
                if (requestStore == null || requestStore.getId() == null) {
                    throw new InvalidOperationException("Vui lòng chọn cửa hàng cho tài khoản này.");
                }

                return storeRepository.findById(requestStore.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cửa hàng."));
            }

            return null;
        }

        if (currentUser.getRole() == Role.ADMIN) {
            if (!ADMIN_MANAGED_ROLES.contains(targetRole)) {
                throw new InvalidOperationException("Admin chỉ được quản lý tài khoản nhân viên của cửa hàng mình.");
            }

            if (currentUser.getStore() == null) {
                throw new InvalidOperationException("Tài khoản admin chưa được gán cửa hàng.");
            }

            return currentUser.getStore();
        }

        throw new InvalidOperationException("Bạn không có quyền quản lý tài khoản.");
    }

    private void ensureCanManageUser(User currentUser, User targetUser) {
        if (currentUser.getRole() == Role.SUPER_ADMIN) {
            return;
        }

        if (currentUser.getRole() == Role.ADMIN) {
            if (!ADMIN_MANAGED_ROLES.contains(targetUser.getRole())) {
                throw new InvalidOperationException("Admin chỉ được quản lý tài khoản nhân viên của cửa hàng mình.");
            }

            Long currentStoreId = getCurrentUserStoreIdOrThrow(currentUser);

            if (
                    targetUser.getStore() == null ||
                            !currentStoreId.equals(targetUser.getStore().getId())
            ) {
                throw new InvalidOperationException("Bạn không có quyền quản lý tài khoản này.");
            }

            return;
        }

        throw new InvalidOperationException("Bạn không có quyền quản lý tài khoản.");
    }

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (
                authentication == null ||
                        !authentication.isAuthenticated() ||
                        authentication instanceof AnonymousAuthenticationToken
        ) {
            throw new InvalidOperationException("Bạn cần đăng nhập.");
        }

        String email = authentication.getName();

        if (email == null || email.isBlank() || "anonymousUser".equals(email)) {
            throw new InvalidOperationException("Bạn cần đăng nhập.");
        }

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản."));
    }

    private Long getCurrentUserStoreIdOrThrow(User user) {
        if (user.getStore() == null) {
            throw new InvalidOperationException("Tài khoản chưa được gán cửa hàng.");
        }

        return user.getStore().getId();
    }

    public CustomerDetailResponse getCustomerDetail(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + userId));

        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<ProductReviewResponse> reviews = productReviewService.getUserReviews(userId);

        long totalOrders = orders.size();
        long completedOrders = orders.stream()
                .filter(o -> o.getStatus() == OrderStatus.Completed)
                .count();
        long cancelledOrders = orders.stream()
                .filter(o -> o.getStatus() == OrderStatus.Cancelled)
                .count();
        long totalSpent = orders.stream()
                .filter(o -> o.getStatus() == OrderStatus.Completed)
                .mapToLong(o -> o.getTotal() != null ? o.getTotal() : 0L)
                .sum();
        long totalReviews = reviews.size();

        CustomerDetailResponse.CustomerStats stats = CustomerDetailResponse.CustomerStats.builder()
                .totalOrders(totalOrders)
                .completedOrders(completedOrders)
                .cancelledOrders(cancelledOrders)
                .totalSpent(totalSpent)
                .totalReviews(totalReviews)
                .build();

        CustomerDetailResponse.UserInfo userInfo = CustomerDetailResponse.UserInfo.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole() != null ? user.getRole().name() : "CUSTOMER")
                .status(user.getStatus())
                .isVerified(user.isVerified())
                .createdAt(user.getCreatedAt())
                .deactivationReason(user.getDeactivationReason())
                .deactivatedAt(user.getDeactivatedAt())
                .deactivatedBy(user.getDeactivatedBy())
                .build();

        List<CustomerDetailResponse.CustomerOrderSummary> orderSummaries = orders.stream()
                .map(o -> {
                    String storeName = "NexCoffee";
                    if (o.getNearestStoreId() != null) {
                        storeName = storeRepository.findById(o.getNearestStoreId())
                                .map(Store::getName)
                                .orElse("NexCoffee");
                    }
                    int itemsCount = 0;
                    if (o.getOrderDetails() != null) {
                        itemsCount = o.getOrderDetails().stream()
                                .mapToInt(od -> od.getQuantity() != null ? od.getQuantity() : 1)
                                .sum();
                    }
                    CustomerDetailResponse.CustomerOrderSummary summary = CustomerDetailResponse.CustomerOrderSummary.builder()
                            .id(o.getId())
                            .code(o.getCode())
                            .createdAt(o.getCreatedAt())
                            .status(o.getStatus() != null ? o.getStatus().name() : "Pending")
                            .total(o.getTotal())
                            .paymentMethod(o.getPaymentMethod() != null ? o.getPaymentMethod().name() : "COD")
                            .itemCount(itemsCount)
                            .storeName(storeName)
                            .build();
                    return summary;
                })
                .collect(Collectors.toList());

        return CustomerDetailResponse.builder()
                .user(userInfo)
                .stats(stats)
                .orders(orderSummaries)
                .reviews(reviews)
                .build();
    }

    @Transactional
    public UserResponse deactivateUser(Long userId, String reason) {
        User currentUser = getCurrentUser();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + userId));

        if (Objects.equals(currentUser.getId(), user.getId())) {
            throw new InvalidOperationException("Bạn không thể tự vô hiệu hóa tài khoản của chính mình.");
        }

        if (user.getRole() == Role.SUPER_ADMIN && currentUser.getRole() != Role.SUPER_ADMIN) {
            throw new InvalidOperationException("Chỉ Super Admin mới có quyền thao tác với tài khoản Super Admin.");
        }

        user.setStatus("DEACTIVATED");
        user.setDeactivationReason(reason != null && !reason.isBlank() ? reason.trim() : "Tài khoản có dấu hiệu bất thường.");
        user.setDeactivatedAt(LocalDateTime.now());
        user.setDeactivatedBy(currentUser.getEmail());

        User saved = userRepository.save(user);
        return mapToUserResponse(saved);
    }

    @Transactional
    public UserResponse reactivateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + userId));

        user.setStatus("ACTIVE");
        user.setDeactivationReason(null);
        user.setDeactivatedAt(null);
        user.setDeactivatedBy(null);

        User saved = userRepository.save(user);
        return mapToUserResponse(saved);
    }

    private UserResponse mapToUserResponse(User user) {
        Store store = user.getStore();

        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .status(user.getStatus())
                .storeId(store == null ? null : store.getId())
                .storeName(store == null ? null : store.getName())
                .deactivationReason(user.getDeactivationReason())
                .deactivatedAt(user.getDeactivatedAt())
                .deactivatedBy(user.getDeactivatedBy())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public List<StaffPerformanceResponse> getStaffPerformanceStats(String range) {
        User currentUser = getCurrentUser();

        Long storeId;
        if (currentUser.getRole() == Role.ADMIN) {
            storeId = getCurrentUserStoreIdOrThrow(currentUser);
        } else if (currentUser.getRole() == Role.SUPER_ADMIN) {
            storeId = currentUser.getStore() != null ? currentUser.getStore().getId() : 1L;
        } else {
            throw new InvalidOperationException("Bạn không có quyền xem thông tin nhân viên.");
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start;
        LocalDateTime end = now;

        String safeRange = (range != null) ? range.trim().toUpperCase() : "TODAY";
        switch (safeRange) {
            case "7_DAYS":
                start = now.minusDays(7).with(java.time.LocalTime.MIN);
                break;
            case "THIS_MONTH":
                start = now.withDayOfMonth(1).with(java.time.LocalTime.MIN);
                break;
            case "ALL":
                start = LocalDateTime.of(2020, 1, 1, 0, 0, 0);
                break;
            case "TODAY":
            default:
                start = now.with(java.time.LocalTime.MIN);
                end = now.with(java.time.LocalTime.MAX);
                break;
        }

        List<User> staffUsers = userRepository.findByStoreIdAndRoleIn(storeId, ADMIN_MANAGED_ROLES);

        // Aggregate POS counts
        List<Object[]> posCounts = orderRepository.countPosOrdersByStaffGrouped(storeId, start, end);
        Map<Long, Long> posMap = new HashMap<>();
        for (Object[] row : posCounts) {
            if (row != null && row.length >= 2 && row[0] != null) {
                posMap.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
            }
        }

        // Aggregate Online counts (Tiếp nhận / Xử lý đơn online)
        List<Object[]> onlineCounts = orderRepository.countOnlineOrdersByStaffGrouped(storeId, start, end);
        Map<Long, Long> onlineMap = new HashMap<>();
        for (Object[] row : onlineCounts) {
            if (row != null && row.length >= 2 && row[0] != null) {
                onlineMap.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
            }
        }

        // Aggregate Barista counts
        List<Object[]> baristaCounts = orderRepository.countBaristaOrdersGrouped(storeId, start, end);
        Map<Long, Long> baristaMap = new HashMap<>();
        for (Object[] row : baristaCounts) {
            if (row != null && row.length >= 2 && row[0] != null) {
                baristaMap.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
            }
        }

        // Aggregate Shipper counts
        List<Object[]> shipperCounts = orderRepository.countShipperOrdersGrouped(storeId, start, end);
        Map<Long, Long> shipperMap = new HashMap<>();
        for (Object[] row : shipperCounts) {
            if (row != null && row.length >= 2 && row[0] != null) {
                shipperMap.put(((Number) row[0]).longValue(), ((Number) row[1]).longValue());
            }
        }

        return staffUsers.stream().map(user -> {
            Store store = user.getStore();
            return StaffPerformanceResponse.builder()
                    .id(user.getId())
                    .fullName(user.getFullName())
                    .email(user.getEmail())
                    .phone(user.getPhone())
                    .role(user.getRole())
                    .status(user.getStatus())
                    .storeId(store != null ? store.getId() : null)
                    .storeName(store != null ? store.getName() : null)
                    .createdAt(user.getCreatedAt())
                    .posOrderCount(posMap.getOrDefault(user.getId(), 0L))
                    .onlineOrderCount(onlineMap.getOrDefault(user.getId(), 0L))
                    .baristaOrderCount(baristaMap.getOrDefault(user.getId(), 0L))
                    .deliveredOrderCount(shipperMap.getOrDefault(user.getId(), 0L))
                    .build();
        }).collect(Collectors.toList());
    }

    public Map<String, Object> getStaffDetailWithOrders(Long staffId, String range) {
        User currentUser = getCurrentUser();
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên."));
        ensureCanManageUser(currentUser, staff);

        Long storeId = staff.getStore() != null ? staff.getStore().getId() : getCurrentUserStoreIdOrThrow(currentUser);

        List<Order> recentOrders = orderRepository.findRecentOrdersByStaffMember(
                storeId,
                staffId,
                org.springframework.data.domain.PageRequest.of(0, 10)
        );

        List<Map<String, Object>> orderSummaries = recentOrders.stream().map(o -> {
            Map<String, Object> item = new HashMap<>();
            item.put("id", o.getId());
            item.put("code", o.getCode());
            item.put("total", o.getTotal());
            item.put("status", o.getStatus());
            item.put("paymentMethod", o.getPaymentMethod());
            item.put("createdAt", o.getCreatedAt());

            boolean isPos = (o.getCode() != null && o.getCode().startsWith("NEX-")) || o.getAddress() == null;
            item.put("channel", isPos ? "POS" : "ONLINE");

            String roleHandled;
            if (o.getBarista() != null && o.getBarista().getId().equals(staffId)) {
                roleHandled = "BARISTA";
            } else if (o.getShipper() != null && o.getShipper().getId().equals(staffId)) {
                roleHandled = "SHIPPER";
            } else if (isPos) {
                roleHandled = "POS";
            } else {
                roleHandled = "ONLINE";
            }
            item.put("roleHandled", roleHandled);
            return item;
        }).collect(Collectors.toList());

        Map<String, Object> res = new HashMap<>();
        res.put("staff", mapToUserResponse(staff));
        res.put("recentOrders", orderSummaries);
        return res;
    }
}