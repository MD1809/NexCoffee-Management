package com.nexcoffee.managementsystem.services;

import com.nexcoffee.managementsystem.dto.response.UserResponse;
import com.nexcoffee.managementsystem.entities.User;
import com.nexcoffee.managementsystem.enums.Role;
import com.nexcoffee.managementsystem.exceptions.InvalidOperationException;
import com.nexcoffee.managementsystem.exceptions.ResourceNotFoundException;
import com.nexcoffee.managementsystem.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id)); // Dùng 404
        return mapToUserResponse(user);
    }

    public List<UserResponse> getActiveShippers() {
        List<User> shippers = userRepository.findByRoleAndStatus(Role.SHIPPER, "ACTIVE");

        if (shippers.isEmpty()) {
            throw new ResourceNotFoundException("Hiện tại không có nhân viên giao hàng nào đang hoạt động!");
        }
        return shippers.stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserResponse createUser(User userRequest) {
        if (userRepository.findByEmail(userRequest.getEmail()).isPresent()) {
            throw new InvalidOperationException("Email này đã được sử dụng!");
        }
        if (userRepository.findByPhone(userRequest.getPhone()).isPresent()) {
            throw new InvalidOperationException("Số điện thoại đã được sử dụng!");
        }

        userRequest.setPassword(passwordEncoder.encode(userRequest.getPassword()));
        userRequest.setVerified(true);

        User savedUser = userRepository.save(userRequest);
        return mapToUserResponse(savedUser);
    }

    @Transactional
    public UserResponse updateUser(Long id, User userDetails) {
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));

        // 1. Kiểm tra trùng Email (loại trừ chính nó)
        userRepository.findByEmail(userDetails.getEmail()).ifPresent(userWithEmail -> {
            if (!userWithEmail.getId().equals(id)) {
                throw new InvalidOperationException("Email này đã được tài khoản khác sử dụng!");
            }
        });

        // 2. Kiểm tra trùng Số điện thoại (loại trừ chính nó)
        userRepository.findByPhone(userDetails.getPhone()).ifPresent(userWithPhone -> {
            if (!userWithPhone.getId().equals(id)) {
                throw new InvalidOperationException("Số điện thoại này đã được tài khoản khác sử dụng!");
            }
        });

        // Cập nhật thông tin
        existingUser.setFullName(userDetails.getFullName());
        existingUser.setEmail(userDetails.getEmail()); // Đảm bảo đã cập nhật cả email
        existingUser.setPhone(userDetails.getPhone());
        existingUser.setRole(userDetails.getRole());
        existingUser.setStatus(userDetails.getStatus());

        if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
            existingUser.setPassword(passwordEncoder.encode(userDetails.getPassword()));
        }

        User updatedUser = userRepository.save(existingUser);
        return mapToUserResponse(updatedUser);
    }

    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("Người dùng không tồn tại để xóa!");
        }
        userRepository.deleteById(id);
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .status(user.getStatus())
                .build();
    }
}