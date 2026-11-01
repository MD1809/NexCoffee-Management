package com.nexcoffee.managementsystem.dto.response;

import com.nexcoffee.managementsystem.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffPerformanceResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private Role role;
    private String status;
    private Long storeId;
    private String storeName;
    private LocalDateTime createdAt;

    // Các chỉ số KPI
    private long posOrderCount;       // Số đơn đứng quầy tạo & hoàn thành
    private long onlineOrderCount;    // Số đơn online tiếp nhận & xử lý
    private long baristaOrderCount;   // Số đơn đã hoàn tất pha chế
    private long deliveredOrderCount; // Số đơn đã giao thành công (với Shipper)
}
