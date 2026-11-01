package com.nexcoffee.managementsystem.dto.response.barista;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BaristaOrderResponse {
    private Integer id;
    private String code;
    private String orderType; // DINE_IN hoặc TAKEAWAY
    private String tableNumber; // Số bàn hoặc Số thẻ rung
    private String staffName; // Nhân viên thu ngân tạo đơn
    private LocalDateTime createdAt;
    private Long elapsedMinutes; // Số phút đã trôi qua kể từ lúc tạo đơn
    private Integer totalItems; // Tổng số ly/món cần làm
    private String note;
    private String status; // Processing, Completed...
    private List<BaristaOrderItemResponse> items;
}
