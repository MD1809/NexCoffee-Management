package com.nexcoffee.managementsystem.dto.chat;

import com.nexcoffee.managementsystem.enums.ChatSenderType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageRequest {
    private Long conversationId;
    private String sessionId;
    private Long storeId;
    private ChatSenderType senderType;
    private Long senderId;
    private String senderName;
    private String content;
}
