package com.nexcoffee.managementsystem.services;

import com.nexcoffee.managementsystem.dto.response.UserResponse;
import com.nexcoffee.managementsystem.entities.Store;
import com.nexcoffee.managementsystem.entities.User;
import com.nexcoffee.managementsystem.enums.Role;
import com.nexcoffee.managementsystem.exceptions.InvalidOperationException;
import com.nexcoffee.managementsystem.exceptions.ResourceNotFoundException;
import com.nexcoffee.managementsystem.repositories.StoreRepository;
import com.nexcoffee.managementsystem.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
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

    private User getCurrentUser() {
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
                .build();
    }
}