package com.nexcoffee.managementsystem.controllers;

import com.nexcoffee.managementsystem.dto.response.store.StoreResponse;
import com.nexcoffee.managementsystem.services.StoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stores")
@RequiredArgsConstructor
public class StorePublicController {

    private final StoreService storeService;

    @GetMapping("/active")
    public List<StoreResponse> getActiveStores() {
        return storeService.getActiveStores();
    }
}