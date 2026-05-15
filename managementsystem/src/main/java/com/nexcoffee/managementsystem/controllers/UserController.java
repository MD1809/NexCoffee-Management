package com.nexcoffee.managementsystem.controllers;

import com.nexcoffee.managementsystem.dto.request.user.UserCreationRequest;
import com.nexcoffee.managementsystem.dto.request.user.UserUpdateRequest;
import com.nexcoffee.managementsystem.dto.request.user.UserUpdateStatus;
import com.nexcoffee.managementsystem.entities.User;
import com.nexcoffee.managementsystem.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping
    User createUser(@RequestBody UserCreationRequest request) {
        return userService.createUser(request);
    }

    @GetMapping
    List<User> getListUsers() {
        return userService.getListUsers();
    }

    @GetMapping("/{userId}")
    User getUser(@PathVariable Integer userId){
        return userService.getUser(userId);
    }

    @PutMapping("/{userId}")
    User updateUser(@PathVariable Integer userId, @RequestBody UserUpdateRequest request) {
        return userService.updateUser(userId, request);
    }

    @PatchMapping("/{userId}/status")
    User updateStatusUser(@PathVariable Integer userId, @RequestBody UserUpdateStatus request) {
        return userService.updateStatusUser(userId, request);
    }

    @DeleteMapping("/{userId}")
    String deleteUser(@PathVariable Integer userId) {
        userService.deleteUser(userId);
        return "User has been deleted";
    }
}
