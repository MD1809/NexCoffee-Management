package com.nexcoffee.managementsystem.controllers;

import com.nexcoffee.managementsystem.dto.response.advertisement.HomeAdvertisementResponse;
import com.nexcoffee.managementsystem.services.HomeAdvertisementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/advertisements")
@RequiredArgsConstructor
public class HomeAdvertisementController {

    private final HomeAdvertisementService homeAdvertisementService;

    @GetMapping("/home-active")
    public ResponseEntity<HomeAdvertisementResponse> getActiveHomeAdvertisement() {
        HomeAdvertisementResponse response =
                homeAdvertisementService.getActiveHomeAdvertisement();

        return ResponseEntity.ok(response);
    }
}