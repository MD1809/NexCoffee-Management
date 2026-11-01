package com.nexcoffee.managementsystem.controllers;

import com.nexcoffee.managementsystem.dto.response.UserResponse;
import com.nexcoffee.managementsystem.entities.User;
import com.nexcoffee.managementsystem.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/staff-stats")
    public ResponseEntity<List<com.nexcoffee.managementsystem.dto.response.StaffPerformanceResponse>> getStaffPerformanceStats(
            @RequestParam(value = "range", defaultValue = "TODAY") String range) {
        return ResponseEntity.ok(userService.getStaffPerformanceStats(range));
    }

    @GetMapping("/{id}/staff-detail")
    public ResponseEntity<java.util.Map<String, Object>> getStaffDetailWithOrders(
            @PathVariable Long id,
            @RequestParam(value = "range", defaultValue = "TODAY") String range) {
        return ResponseEntity.ok(userService.getStaffDetailWithOrders(id, range));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @GetMapping("/shippers")
    public ResponseEntity<List<UserResponse>> getShippers() {
        return ResponseEntity.ok(userService.getActiveShippers());
    }

    @PostMapping
    public ResponseEntity<UserResponse> createUser(@RequestBody User user) {
        return ResponseEntity.ok(userService.createUser(user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @RequestBody User userDetails) {
        return ResponseEntity.ok(userService.updateUser(id, userDetails));
    }

    @GetMapping("/{id}/customer-detail")
    public ResponseEntity<com.nexcoffee.managementsystem.dto.response.CustomerDetailResponse> getCustomerDetail(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getCustomerDetail(id));
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<UserResponse> deactivateUser(
            @PathVariable Long id,
            @RequestBody(required = false) java.util.Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(userService.deactivateUser(id, reason));
    }

    @PutMapping("/{id}/reactivate")
    public ResponseEntity<UserResponse> reactivateUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.reactivateUser(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}