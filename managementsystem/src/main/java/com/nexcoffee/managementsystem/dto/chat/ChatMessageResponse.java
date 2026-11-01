package com.nexcoffee.managementsystem.dto.chat;

import com.nexcoffee.managementsystem.enums.ChatMessageType;
import com.nexcoffee.managementsystem.enums.ChatSenderType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageResponse {
    private Long id;
    private Long conversationId;
    private ChatSenderType senderType;
    private Long senderId;
    private String senderName;
    private String content;
    private ChatMessageType messageType;
    private String metadataJson;
    private boolean isRead;
    private LocalDateTime createdAt;
}
