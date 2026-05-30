package com.nexcoffee.managementsystem.dto.response.advertisement;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class HomeAdvertisementResponse {

    private Long id;

    private String title;
    private String imageUrl;

    private String targetType;
    private Long targetId;
    private String targetUrl;

    private Boolean active;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}