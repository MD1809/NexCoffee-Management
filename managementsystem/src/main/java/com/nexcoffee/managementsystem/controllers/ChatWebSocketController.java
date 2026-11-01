package com.nexcoffee.managementsystem.controllers;

import com.nexcoffee.managementsystem.dto.chat.ChatMessageRequest;
import com.nexcoffee.managementsystem.enums.ChatSenderType;
import com.nexcoffee.managementsystem.services.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.sendMessage")
    public void handleIncomingMessage(@Payload ChatMessageRequest request) {
        log.info("WebSocket incoming message for conv {}: sender={}, type={}",
                request.getConversationId(), request.getSenderName(), request.getSenderType());

        if (request.getSenderType() == ChatSenderType.STAFF) {
            chatService.processStaffMessage(
                    request.getConversationId(),
                    request.getSenderId(),
                    request.getSenderName(),
                    request.getContent()
            );
        } else {
            chatService.processCustomerMessage(request);
        }
    }

    @MessageMapping("/chat.typing")
    public void handleTypingEvent(@Payload Map<String, Object> payload) {
        if (payload != null && payload.get("conversationId") != null) {
            try {
                Long conversationId = Long.valueOf(payload.get("conversationId").toString());
                messagingTemplate.convertAndSend("/topic/conversation/" + conversationId + "/typing", (Object) payload);
            } catch (Exception ex) {
                log.warn("Failed to broadcast typing event: {}", ex.getMessage());
            }
        }
    }
}
