package com.nexcoffee.managementsystem.controllers;

import com.nexcoffee.managementsystem.dto.request.delivery.DeliveryPreviewRequest;
import com.nexcoffee.managementsystem.dto.response.delivery.DeliveryPreviewResponse;
import com.nexcoffee.managementsystem.services.DeliveryPreviewService;
import com.nexcoffee.managementsystem.services.TrackAsiaMapService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/maps")
@RequiredArgsConstructor
public class MapController {

    private final TrackAsiaMapService trackAsiaMapService;
    private final DeliveryPreviewService deliveryPreviewService;

    @GetMapping(value = "/autocomplete", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> autocomplete(@RequestParam String input) {
        return ResponseEntity
                .ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(trackAsiaMapService.autocomplete(input));
    }

    @GetMapping(value = "/place-detail", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> placeDetail(@RequestParam String placeId) {
        return ResponseEntity
                .ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(trackAsiaMapService.placeDetail(placeId));
    }

    @PostMapping("/delivery-preview")
    public DeliveryPreviewResponse deliveryPreview(
            @Valid @RequestBody DeliveryPreviewRequest request
    ) {
        return deliveryPreviewService.preview(request);
    }
}