package com.nexcoffee.managementsystem.dto.request.advertisement;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class HomeAdvertisementRequest {

    private String title;

    private MultipartFile image;

    private String targetType;

    private Long targetId;

    private Boolean active;
}