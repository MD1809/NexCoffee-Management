package com.nexcoffee.managementsystem.services;

import com.nexcoffee.managementsystem.dto.request.user.UserCreationRequest;
import com.nexcoffee.managementsystem.dto.request.user.UserUpdateRequest;
import com.nexcoffee.managementsystem.dto.request.user.UserUpdateStatus;
import com.nexcoffee.managementsystem.entities.User;
import com.nexcoffee.managementsystem.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public List<User> getListUsers(){
        return userRepository.findAll();
    }

    public User getUser(Integer userId){
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));
    }

    public User createUser(UserCreationRequest request) {
        User newUser = new User();

        newUser.setFullName(request.getFullName());
        newUser.setEmail(request.getEmail());
        newUser.setPhone(request.getPhone());
        newUser.setPassword(request.getPassword());
        newUser.setRole(request.getRole());
        newUser.setStatus(request.getStatus());
        newUser.setCreatedAt(LocalDateTime.now());
        newUser.setUpdatedAt(LocalDateTime.now());

        return userRepository.save(newUser);
    }

    public User updateUser(Integer userId, UserUpdateRequest request) {
        User user = getUser(userId);

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPassword(request.getPassword());
        user.setRole(request.getRole());
        user.setStatus(request.getStatus());
        user.setUpdatedAt(LocalDateTime.now());

        return userRepository.save(user);
    }

    public  User updateStatusUser(Integer userId, UserUpdateStatus request) {
        User user = getUser(userId);
        user.setStatus(request.getStatus());
        user.setUpdatedAt(LocalDateTime.now());

        return userRepository.save(user);
    }

    public void deleteUser(Integer userId) {
        userRepository.deleteById(userId);
    }
}
