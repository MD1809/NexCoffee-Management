package com.nexcoffee.managementsystem.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreComparisonResponse {
    private Long storeId;
    private String storeName;
    private String address;
    private Long revenue;
    private Long ordersCount;
    private Double sharePercentage;
}
