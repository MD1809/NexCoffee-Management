package com.nexcoffee.managementsystem.dto.chat;

import com.nexcoffee.managementsystem.enums.ConversationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatConversationResponse {
    private Long id;
    private String sessionId;
    private Long userId;
    private Long storeId;
    private String storeName;
    private String customerName;
    private String customerPhone;
    private ConversationStatus status;
    private String handoverReason;
    private Long assignedStaffId;
    private String assignedStaffName;
    private String lastMessageSnippet;
    private int unreadCountStaff;
    private int unreadCountCustomer;
    private LocalDateTime updatedAt;
    private LocalDateTime createdAt;
}
