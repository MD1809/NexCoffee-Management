package com.nexcoffee.managementsystem.controllers;

import com.nexcoffee.managementsystem.dto.chat.ChatConversationResponse;
import com.nexcoffee.managementsystem.dto.chat.ChatMessageRequest;
import com.nexcoffee.managementsystem.dto.chat.ChatMessageResponse;
import com.nexcoffee.managementsystem.dto.chat.CustomerChatContextResponse;
import com.nexcoffee.managementsystem.entities.User;
import com.nexcoffee.managementsystem.enums.ConversationStatus;
import com.nexcoffee.managementsystem.enums.Role;
import com.nexcoffee.managementsystem.services.ChatService;
import com.nexcoffee.managementsystem.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final UserService userService;

    // --- PUBLIC APIS CHO KHÁCH HÀNG & KHÁCH VÃNG LAI ---

    @PostMapping("/public/init")
    public ResponseEntity<ChatConversationResponse> initConversation(@RequestBody Map<String, Object> body) {
        String sessionId = (String) body.get("sessionId");
        Long userId = body.get("userId") != null ? Long.valueOf(body.get("userId").toString()) : null;
        Long storeId = body.get("storeId") != null ? Long.valueOf(body.get("storeId").toString()) : null;
        String customerName = (String) body.get("customerName");
        String customerPhone = (String) body.get("customerPhone");

        ChatConversationResponse response = chatService.getOrCreateConversation(sessionId, userId, storeId, customerName, customerPhone);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/public/{conversationId}/messages")
    public ResponseEntity<List<ChatMessageResponse>> getMessages(@PathVariable Long conversationId) {
        return ResponseEntity.ok(chatService.getMessages(conversationId));
    }

    @PostMapping("/public/message")
    public ResponseEntity<ChatMessageResponse> sendCustomerMessage(@RequestBody ChatMessageRequest request) {
        ChatMessageResponse response = chatService.processCustomerMessage(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/public/{conversationId}/handover")
    public ResponseEntity<ChatConversationResponse> requestHandover(
            @PathVariable Long conversationId,
            @RequestBody(required = false) Map<String, Object> body
    ) {
        String name = body != null ? (String) body.get("customerName") : null;
        String phone = body != null ? (String) body.get("customerPhone") : null;
        Long storeId = (body != null && body.get("storeId") != null) ? Long.valueOf(body.get("storeId").toString()) : null;
        String reason = body != null ? (String) body.get("reason") : null;
        if (reason == null && body != null && body.get("handoverReason") != null) {
            reason = (String) body.get("handoverReason");
        }

        ChatConversationResponse response = chatService.requestStaffHandover(conversationId, name, phone, storeId, reason);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/public/{conversationId}/return-bot")
    public ResponseEntity<ChatConversationResponse> returnToBot(@PathVariable Long conversationId) {
        return ResponseEntity.ok(chatService.returnToBot(conversationId));
    }

    @PostMapping("/public/{conversationId}/read")
    public ResponseEntity<Void> markReadCustomer(@PathVariable Long conversationId) {
        chatService.markMessagesAsRead(conversationId, "CUSTOMER");
        return ResponseEntity.ok().build();
    }

    // --- ADMIN / STAFF APIS CHO HỘP THƯ HỖ TRỢ ---

    @GetMapping("/admin/conversations")
    public ResponseEntity<List<ChatConversationResponse>> getStoreConversations(
            @RequestParam(required = false) Long storeId,
            @RequestParam(required = false) ConversationStatus status
    ) {
        User currentUser = userService.getCurrentUser();
        Long effectiveStoreId = storeId;
        if (currentUser.getRole() == Role.ADMIN || currentUser.getRole() == Role.STAFF) {
            if (currentUser.getStore() != null) {
                effectiveStoreId = currentUser.getStore().getId();
            }
        }

        List<ChatConversationResponse> list = chatService.getStoreConversations(effectiveStoreId, status);
        return ResponseEntity.ok(list);
    }

    @PostMapping("/admin/{conversationId}/message")
    public ResponseEntity<ChatMessageResponse> sendStaffMessage(
            @PathVariable Long conversationId,
            @RequestBody Map<String, String> body
    ) {
        User currentUser = userService.getCurrentUser();
        String content = body.get("content");
        ChatMessageResponse response = chatService.processStaffMessage(
                conversationId,
                currentUser.getId(),
                currentUser.getFullName(),
                content
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/admin/{conversationId}/assign")
    public ResponseEntity<ChatConversationResponse> assignStaff(@PathVariable Long conversationId) {
        User currentUser = userService.getCurrentUser();
        ChatConversationResponse response = chatService.assignStaffToConversation(conversationId, currentUser.getId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/admin/{conversationId}/close")
    public ResponseEntity<ChatConversationResponse> closeConversation(@PathVariable Long conversationId) {
        ChatConversationResponse response = chatService.closeConversation(conversationId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/admin/{conversationId}/read")
    public ResponseEntity<Void> markReadStaff(@PathVariable Long conversationId) {
        chatService.markMessagesAsRead(conversationId, "STAFF");
        return ResponseEntity.ok().build();
    }

    @GetMapping("/admin/conversations/{conversationId}/context")
    public ResponseEntity<CustomerChatContextResponse> getCustomerContext(@PathVariable Long conversationId) {
        return ResponseEntity.ok(chatService.getCustomerContext(conversationId));
    }

    @PostMapping("/admin/{conversationId}/send-order-card")
    public ResponseEntity<ChatMessageResponse> sendOrderCard(
            @PathVariable Long conversationId,
            @RequestBody Map<String, Object> body
    ) {
        User currentUser = userService.getCurrentUser();
        Integer orderId = body.get("orderId") != null ? Integer.valueOf(body.get("orderId").toString()) : null;
        String orderCode = (String) body.get("orderCode");

        ChatMessageResponse response = chatService.sendOrderCard(
                conversationId,
                currentUser.getId(),
                currentUser.getFullName(),
                orderId,
                orderCode
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/admin/stats")
    public ResponseEntity<Map<String, Long>> getQueueStats(@RequestParam(required = false) Long storeId) {
        User currentUser = userService.getCurrentUser();
        Long effectiveStoreId = storeId;
        if (currentUser.getRole() == Role.ADMIN || currentUser.getRole() == Role.STAFF) {
            if (currentUser.getStore() != null) {
                effectiveStoreId = currentUser.getStore().getId();
            }
        }
        return ResponseEntity.ok(chatService.getQueueStats(effectiveStoreId));
    }
}
