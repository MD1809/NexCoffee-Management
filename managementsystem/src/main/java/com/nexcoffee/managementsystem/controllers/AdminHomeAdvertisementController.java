package com.nexcoffee.managementsystem.controllers;

import com.nexcoffee.managementsystem.dto.request.advertisement.HomeAdvertisementRequest;
import com.nexcoffee.managementsystem.dto.response.advertisement.HomeAdvertisementResponse;
import com.nexcoffee.managementsystem.services.HomeAdvertisementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/advertisements")
@RequiredArgsConstructor
public class AdminHomeAdvertisementController {

    private final HomeAdvertisementService homeAdvertisementService;

    @GetMapping
    public ResponseEntity<List<HomeAdvertisementResponse>> getAll() {
        return ResponseEntity.ok(homeAdvertisementService.getAll());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<HomeAdvertisementResponse> create(
            @ModelAttribute HomeAdvertisementRequest request
    ) {
        return ResponseEntity.ok(homeAdvertisementService.create(request));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<HomeAdvertisementResponse> update(
            @PathVariable Long id,
            @ModelAttribute HomeAdvertisementRequest request
    ) {
        return ResponseEntity.ok(homeAdvertisementService.update(id, request));
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<HomeAdvertisementResponse> activate(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(homeAdvertisementService.activate(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(
            @PathVariable Long id
    ) {
        homeAdvertisementService.delete(id);

        return ResponseEntity.ok("Xóa quảng cáo thành công.");
    }
}