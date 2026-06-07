package com.nexcoffee.managementsystem.dto.response.store;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class StoreResponse {

    private Long id;

    private String name;

    private String phone;

    private String address;

    private Double latitude;

    private Double longitude;

    private String status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}