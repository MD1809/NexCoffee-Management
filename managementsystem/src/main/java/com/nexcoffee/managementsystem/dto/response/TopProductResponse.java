package com.nexcoffee.managementsystem.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TopProductResponse {
    private String productName;
    private Long quantitySold;
    private Double percentage;
    private String image;
    private String status;
}