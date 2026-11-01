package com.nexcoffee.managementsystem.services;

import com.nexcoffee.managementsystem.dto.chat.ChatConversationResponse;
import com.nexcoffee.managementsystem.dto.chat.ChatMessageRequest;
import com.nexcoffee.managementsystem.dto.chat.ChatMessageResponse;
import com.nexcoffee.managementsystem.dto.chat.CustomerChatContextResponse;
import com.nexcoffee.managementsystem.entities.*;
import com.nexcoffee.managementsystem.enums.ChatMessageType;
import com.nexcoffee.managementsystem.enums.ChatSenderType;
import com.nexcoffee.managementsystem.enums.ConversationStatus;
import com.nexcoffee.managementsystem.enums.OrderStatus;
import com.nexcoffee.managementsystem.exceptions.InvalidOperationException;
import com.nexcoffee.managementsystem.exceptions.ResourceNotFoundException;
import com.nexcoffee.managementsystem.repositories.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatConversationRepository conversationRepository;
    private final ChatMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final StoreRepository storeRepository;
    private final OrderRepository orderRepository;
    private final GeminiChatService geminiChatService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public ChatConversationResponse getOrCreateConversation(String sessionId, Long userId, Long storeId, String customerName, String customerPhone) {
        ChatConversation conversation = null;

        if (userId != null) {
            Optional<ChatConversation> userConvOpt = conversationRepository.findTopByUserIdOrderByUpdatedAtDesc(userId);
            if (userConvOpt.isPresent()) {
                conversation = userConvOpt.get();
            }
        }

        if (conversation == null && sessionId != null && !sessionId.isBlank()) {
            Optional<ChatConversation> sessionConvOpt = conversationRepository.findTopBySessionIdOrderByUpdatedAtDesc(sessionId);
            if (sessionConvOpt.isPresent()) {
                conversation = sessionConvOpt.get();
            }
        }

        if (conversation == null) {
            User user = (userId != null) ? userRepository.findById(userId).orElse(null) : null;
            Store store = null;
            if (storeId != null) {
                store = storeRepository.findById(storeId).orElse(null);
            }
            if (store == null) {
                List<Store> stores = storeRepository.findAll();
                if (!stores.isEmpty()) {
                    store = stores.get(0);
                }
            }

            String effectiveName = (customerName != null && !customerName.isBlank())
                    ? customerName
                    : (user != null ? user.getFullName() : "Khách hàng");

            conversation = ChatConversation.builder()
                    .sessionId(sessionId)
                    .user(user)
                    .store(store)
                    .customerName(effectiveName)
                    .customerPhone(customerPhone != null ? customerPhone : (user != null ? user.getPhone() : null))
                    .status(ConversationStatus.BOT)
                    .lastMessageSnippet("Khởi tạo cuộc trò chuyện")
                    .build();

            conversation = conversationRepository.save(conversation);

            // Gửi tin nhắn chào mừng mặc định từ Bot
            ChatMessage welcomeMsg = ChatMessage.builder()
                    .conversation(conversation)
                    .senderType(ChatSenderType.BOT)
                    .senderName("Trợ lý NexCoffee")
                    .content("NexCoffee xin chào bạn! Mình có thể giúp gì cho bạn hôm nay (tìm món ngon, gợi ý đồ uống, hoặc tra cứu tiến độ đơn hàng)?")
                    .messageType(ChatMessageType.TEXT)
                    .isRead(true)
                    .build();
            messageRepository.save(welcomeMsg);
        } else {
            // Cập nhật thông tin nếu có
            if (customerName != null && !customerName.isBlank()) {
                conversation.setCustomerName(customerName);
            }
            if (customerPhone != null && !customerPhone.isBlank()) {
                conversation.setCustomerPhone(customerPhone);
            }
            if (storeId != null && conversation.getStore() == null) {
                storeRepository.findById(storeId).ifPresent(conversation::setStore);
            }
            if (userId != null && conversation.getUser() == null) {
                userRepository.findById(userId).ifPresent(conversation::setUser);
            }
            conversation = conversationRepository.save(conversation);
        }

        return mapToConversationResponse(conversation);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessages(Long conversationId) {
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId).stream()
                .map(this::mapToMessageResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ChatMessageResponse processCustomerMessage(ChatMessageRequest request) {
        ChatConversation conversation = conversationRepository.findById(request.getConversationId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên trò chuyện."));

        // Nếu cuộc trò chuyện trước đó đã bị đóng (CLOSED), tự động kích hoạt lại sang chế độ BOT
        if (conversation.getStatus() == ConversationStatus.CLOSED) {
            conversation.setStatus(ConversationStatus.BOT);
        }

        // Lưu tin nhắn của khách
        ChatMessage customerMsg = ChatMessage.builder()
                .conversation(conversation)
                .senderType(ChatSenderType.CUSTOMER)
                .senderId(request.getSenderId())
                .senderName(request.getSenderName() != null ? request.getSenderName() : conversation.getCustomerName())
                .content(request.getContent())
                .messageType(ChatMessageType.TEXT)
                .isRead(false)
                .build();

        ChatMessage savedCustomerMsg = messageRepository.save(customerMsg);

        conversation.setLastMessageSnippet(request.getContent());

        // Nếu đang ở chế độ BOT -> Bot xử lý tự động
        if (conversation.getStatus() == ConversationStatus.BOT) {
            conversationRepository.save(conversation);

            // Broadcast tin nhắn của khách đến topic của hội thoại
            ChatMessageResponse custResp = mapToMessageResponse(savedCustomerMsg);
            messagingTemplate.convertAndSend("/topic/conversation/" + conversation.getId(), custResp);

            // Tạo phản hồi từ Bot
            GeminiChatService.BotReply botReply = geminiChatService.generateReply(request.getContent(), conversation);

            ChatMessage botMsg = ChatMessage.builder()
                    .conversation(conversation)
                    .senderType(ChatSenderType.BOT)
                    .senderName("Trợ lý NexCoffee")
                    .content(botReply.getContent())
                    .messageType(botReply.getMessageType() != null ? botReply.getMessageType() : ChatMessageType.TEXT)
                    .metadataJson(botReply.getMetadataJson())
                    .isRead(true)
                    .build();

            ChatMessage savedBotMsg = messageRepository.save(botMsg);
            conversation.setLastMessageSnippet(botMsg.getContent());
            conversationRepository.save(conversation);

            ChatMessageResponse botResp = mapToMessageResponse(savedBotMsg);
            // Gửi tin nhắn của bot về topic hội thoại
            messagingTemplate.convertAndSend("/topic/conversation/" + conversation.getId(), botResp);

            return botResp;
        } else {
            // Chế độ LIVE CHAT (WAITING_STAFF hoặc WITH_STAFF)
            conversation.setUnreadCountStaff(conversation.getUnreadCountStaff() + 1);
            conversationRepository.save(conversation);

            ChatMessageResponse custResp = mapToMessageResponse(savedCustomerMsg);
            messagingTemplate.convertAndSend("/topic/conversation/" + conversation.getId(), custResp);

            // Bắn tín hiệu đến hàng chờ chi nhánh để nhân viên nhận biết
            if (conversation.getStore() != null) {
                messagingTemplate.convertAndSend(
                        "/topic/store/" + conversation.getStore().getId() + "/chat-queue",
                        mapToConversationResponse(conversation)
                );
            }

            return custResp;
        }
    }

    @Transactional
    public ChatMessageResponse processStaffMessage(Long conversationId, Long staffId, String staffName, String content) {
        ChatConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên trò chuyện."));

        ChatMessage staffMsg = ChatMessage.builder()
                .conversation(conversation)
                .senderType(ChatSenderType.STAFF)
                .senderId(staffId)
                .senderName(staffName != null ? staffName : "Nhân viên hỗ trợ")
                .content(content)
                .messageType(ChatMessageType.TEXT)
                .isRead(false)
                .build();

        ChatMessage savedStaffMsg = messageRepository.save(staffMsg);

        conversation.setLastMessageSnippet(content);
        conversation.setUnreadCountCustomer(conversation.getUnreadCountCustomer() + 1);
        if (conversation.getStatus() == ConversationStatus.WAITING_STAFF) {
            conversation.setStatus(ConversationStatus.WITH_STAFF);
            if (staffId != null) {
                userRepository.findById(staffId).ifPresent(conversation::setAssignedStaff);
            }
        }
        conversationRepository.save(conversation);

        ChatMessageResponse resp = mapToMessageResponse(savedStaffMsg);
        messagingTemplate.convertAndSend("/topic/conversation/" + conversation.getId(), resp);

        return resp;
    }

    @Transactional
    public ChatConversationResponse requestStaffHandover(Long conversationId, String customerName, String customerPhone, Long storeId, String reason) {
        ChatConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên trò chuyện."));

        // Chống spam: Nếu đang trong hàng đợi WAITING_STAFF và vừa cập nhật trong vòng 45 giây
        if (conversation.getStatus() == ConversationStatus.WAITING_STAFF &&
                conversation.getUpdatedAt() != null &&
                conversation.getUpdatedAt().isAfter(LocalDateTime.now().minusSeconds(45))) {
            throw new InvalidOperationException("Yêu cầu của bạn đang được xếp hàng chờ nhân viên. Vui lòng đợi trong giây lát hoặc tiếp tục chat cùng AI.");
        }

        // Chống spam: Kiểm tra tính hợp lệ của Số điện thoại
        if (customerPhone != null && !customerPhone.isBlank()) {
            String cleanedPhone = customerPhone.replaceAll("\\s+", "");
            if (!cleanedPhone.matches("^(03|05|07|08|09)\\d{8}$")) {
                throw new InvalidOperationException("Số điện thoại không đúng định dạng nhà mạng Việt Nam (yêu cầu 10 chữ số).");
            }
            if (isSuspiciousPhone(cleanedPhone)) {
                throw new InvalidOperationException("Số điện thoại không hợp lệ hoặc nằm trong danh sách nghi vấn spam.");
            }
            conversation.setCustomerPhone(cleanedPhone);
        }

        // Chống spam: Phân loại lý do kết nối
        String reasonText;
        if ("ORDER_ISSUE".equalsIgnoreCase(reason)) {
            reasonText = "Sự cố đơn hàng / Giao trễ";
        } else if ("PAYMENT_ISSUE".equalsIgnoreCase(reason)) {
            reasonText = "Vấn đề thanh toán / Hoàn tiền";
        } else if ("COMPLAINT".equalsIgnoreCase(reason)) {
            reasonText = "Khiếu nại đồ uống / Phục vụ";
        } else if ("BULK_CATERING".equalsIgnoreCase(reason)) {
            reasonText = "Tư vấn tiệc / Đặt số lượng lớn";
        } else if (reason != null && !reason.isBlank()) {
            reasonText = reason.trim();
        } else {
            reasonText = "Tư vấn chung";
        }

        conversation.setStatus(ConversationStatus.WAITING_STAFF);
        conversation.setHandoverReason(reasonText);
        if (customerName != null && !customerName.isBlank()) conversation.setCustomerName(customerName.trim());
        if (storeId != null) storeRepository.findById(storeId).ifPresent(conversation::setStore);

        conversation.setUnreadCountStaff(conversation.getUnreadCountStaff() + 1);
        conversation = conversationRepository.save(conversation);

        // Lưu thông báo hệ thống chi tiết có kèm lý do phân loại
        String branchName = conversation.getStore() != null ? conversation.getStore().getName() : "phù hợp";
        ChatMessage sysMsg = ChatMessage.builder()
                .conversation(conversation)
                .senderType(ChatSenderType.BOT)
                .senderName("Hệ thống")
                .content("Khách hàng yêu cầu hỗ trợ trực tiếp. [Lý do: " + reasonText + "]. Đang chuyển tiếp đến chi nhánh " + branchName + "...")
                .messageType(ChatMessageType.SYSTEM)
                .isRead(true)
                .build();
        messageRepository.save(sysMsg);

        ChatConversationResponse resp = mapToConversationResponse(conversation);
        messagingTemplate.convertAndSend("/topic/conversation/" + conversation.getId(), resp);

        if (conversation.getStore() != null) {
            messagingTemplate.convertAndSend(
                    "/topic/store/" + conversation.getStore().getId() + "/chat-queue",
                    resp
            );
        }

        return resp;
    }

    private boolean isSuspiciousPhone(String phone) {
        if (phone == null) return false;
        String p = phone.trim().replaceAll("\\s+", "");
        if (p.equals("0123456789") || p.equals("0987654321") || p.equals("0999999999") || p.equals("0000000000")) {
            return true;
        }
        if (p.length() == 10) {
            String suffix = p.substring(2);
            if (suffix.chars().distinct().count() <= 1) {
                return true;
            }
        }
        return false;
    }

    @Transactional
    public ChatConversationResponse assignStaffToConversation(Long conversationId, Long staffId) {
        ChatConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên trò chuyện."));

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên."));

        conversation.setStatus(ConversationStatus.WITH_STAFF);
        conversation.setAssignedStaff(staff);
        conversation.setUnreadCountStaff(0);
        conversation = conversationRepository.save(conversation);

        ChatMessage sysMsg = ChatMessage.builder()
                .conversation(conversation)
                .senderType(ChatSenderType.STAFF)
                .senderId(staff.getId())
                .senderName(staff.getFullName())
                .content("Nhân viên " + staff.getFullName() + " đã tiếp nhận hỗ trợ. Chào bạn, mình có thể hỗ trợ gì cho bạn?")
                .messageType(ChatMessageType.SYSTEM)
                .isRead(false)
                .build();
        messageRepository.save(sysMsg);

        ChatConversationResponse resp = mapToConversationResponse(conversation);
        messagingTemplate.convertAndSend("/topic/conversation/" + conversation.getId(), resp);
        messagingTemplate.convertAndSend("/topic/conversation/" + conversation.getId(), mapToMessageResponse(sysMsg));

        if (conversation.getStore() != null) {
            messagingTemplate.convertAndSend(
                    "/topic/store/" + conversation.getStore().getId() + "/chat-queue",
                    resp
            );
        }

        return resp;
    }

    @Transactional
    public ChatConversationResponse closeConversation(Long conversationId) {
        ChatConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên trò chuyện."));

        conversation.setStatus(ConversationStatus.CLOSED);
        conversation.setUnreadCountStaff(0);
        conversation.setUnreadCountCustomer(0);
        conversation = conversationRepository.save(conversation);

        ChatMessage sysMsg = ChatMessage.builder()
                .conversation(conversation)
                .senderType(ChatSenderType.BOT)
                .senderName("Hệ thống")
                .content("Cuộc trò chuyện đã kết thúc. Cảm ơn bạn đã liên hệ với NexCoffee! Chúc bạn một ngày tuyệt vời ☕")
                .messageType(ChatMessageType.SYSTEM)
                .isRead(true)
                .build();
        messageRepository.save(sysMsg);

        ChatConversationResponse resp = mapToConversationResponse(conversation);
        messagingTemplate.convertAndSend("/topic/conversation/" + conversation.getId(), resp);
        messagingTemplate.convertAndSend("/topic/conversation/" + conversation.getId(), mapToMessageResponse(sysMsg));

        return resp;
    }

    @Transactional(readOnly = true)
    public List<ChatConversationResponse> getStoreConversations(Long storeId, ConversationStatus status) {
        List<ChatConversation> list = conversationRepository.findSupportConversations(storeId, status);
        return list.stream().map(this::mapToConversationResponse).collect(Collectors.toList());
    }

    @Transactional
    public void markMessagesAsRead(Long conversationId, String readerType) {
        if ("STAFF".equalsIgnoreCase(readerType)) {
            messageRepository.markAllCustomerMessagesAsRead(conversationId);
            conversationRepository.findById(conversationId).ifPresent(c -> {
                c.setUnreadCountStaff(0);
                conversationRepository.save(c);
            });
        } else {
            messageRepository.markAllStaffMessagesAsRead(conversationId);
            conversationRepository.findById(conversationId).ifPresent(c -> {
                c.setUnreadCountCustomer(0);
                conversationRepository.save(c);
            });
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getQueueStats(Long storeId) {
        Map<String, Long> stats = new HashMap<>();
        if (storeId != null) {
            stats.put("waitingCount", conversationRepository.countByStoreIdAndStatus(storeId, ConversationStatus.WAITING_STAFF));
            stats.put("withStaffCount", conversationRepository.countByStoreIdAndStatus(storeId, ConversationStatus.WITH_STAFF));
            stats.put("activeTotal", conversationRepository.countActiveSupportByStoreId(storeId));
        } else {
            stats.put("waitingCount", conversationRepository.countByStatus(ConversationStatus.WAITING_STAFF));
            stats.put("withStaffCount", conversationRepository.countByStatus(ConversationStatus.WITH_STAFF));
            stats.put("activeTotal", conversationRepository.countActiveSupportAll());
        }
        return stats;
    }

    @Transactional
    public ChatConversationResponse returnToBot(Long conversationId) {
        ChatConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên trò chuyện."));
        conversation.setStatus(ConversationStatus.BOT);
        conversation.setLastMessageSnippet("Quay lại trò chuyện với AI");
        ChatConversation saved = conversationRepository.save(conversation);

        ChatMessage sysMsg = ChatMessage.builder()
                .conversation(saved)
                .senderType(ChatSenderType.BOT)
                .senderName("Hệ thống")
                .content("Khách hàng đã chuyển về trò chuyện cùng trợ lý AI.")
                .messageType(ChatMessageType.SYSTEM)
                .isRead(true)
                .build();
        messageRepository.save(sysMsg);

        ChatConversationResponse resp = mapToConversationResponse(saved);
        messagingTemplate.convertAndSend("/topic/conversation/" + conversationId, resp);
        messagingTemplate.convertAndSend("/topic/conversation/" + conversationId, mapToMessageResponse(sysMsg));

        if (saved.getStore() != null) {
            messagingTemplate.convertAndSend(
                    "/topic/store/" + saved.getStore().getId() + "/chat-queue",
                    resp
            );
        }
        messagingTemplate.convertAndSend("/topic/admin/queue", resp);

        return resp;
    }

    @Transactional(readOnly = true)
    public CustomerChatContextResponse getCustomerContext(Long conversationId) {
        ChatConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên trò chuyện."));

        User user = conversation.getUser();
        boolean isMember = (user != null);
        String name = conversation.getCustomerName();
        String phone = conversation.getCustomerPhone();
        String email = null;
        LocalDateTime memberSince = null;
        Long totalSpent = 0L;
        int orderCount = 0;
        List<Order> orders = Collections.emptyList();

        if (isMember) {
            name = user.getFullName();
            phone = user.getPhone();
            email = user.getEmail();
            memberSince = user.getCreatedAt();
            orders = orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
            orderCount = orders.size();
            totalSpent = orders.stream()
                    .filter(o -> o.getStatus() == OrderStatus.Completed)
                    .mapToLong(Order::getTotal)
                    .sum();
        } else if (phone != null && !phone.isBlank()) {
            orders = orderRepository.findByPhoneOrderByCreatedAtDesc(phone);
            orderCount = orders.size();
            totalSpent = orders.stream()
                    .filter(o -> o.getStatus() == OrderStatus.Completed)
                    .mapToLong(Order::getTotal)
                    .sum();
        }

        // Lấy 5 đơn gần nhất
        List<CustomerChatContextResponse.RecentOrderItemDto> recentOrders = orders.stream()
                .limit(5)
                .map(this::mapToRecentOrderItemDto)
                .collect(Collectors.toList());

        return CustomerChatContextResponse.builder()
                .isMember(isMember)
                .userId(user != null ? user.getId() : null)
                .customerName(name != null ? name : "Khách hàng")
                .phone(phone)
                .email(email)
                .handoverReason(conversation.getHandoverReason())
                .totalSpent(totalSpent)
                .orderCount(orderCount)
                .memberSince(memberSince)
                .recentOrders(recentOrders)
                .build();
    }

    private CustomerChatContextResponse.RecentOrderItemDto mapToRecentOrderItemDto(Order order) {
        String statusText;
        switch (order.getStatus()) {
            case Pending -> statusText = "Chờ xử lý";
            case Processing -> statusText = "Đang pha chế";
            case Shipped -> statusText = "Đang giao";
            case Completed -> statusText = "Hoàn thành";
            case Cancelled -> statusText = "Đã hủy";
            default -> statusText = order.getStatus().name();
        }

        String itemsSummary = "Đơn hàng";
        if (order.getOrderDetails() != null && !order.getOrderDetails().isEmpty()) {
            itemsSummary = order.getOrderDetails().stream()
                    .map(od -> {
                        String productName = (od.getProductVariant() != null && od.getProductVariant().getProduct() != null)
                                ? od.getProductVariant().getProduct().getName()
                                : "Sản phẩm";
                        return od.getQuantity() + "x " + productName;
                    })
                    .collect(Collectors.joining(", "));
        }

        NumberFormat formatter = NumberFormat.getInstance(new Locale("vi", "VN"));
        String totalFormatted = formatter.format(order.getTotal() != null ? order.getTotal() : 0L) + "đ";

        return CustomerChatContextResponse.RecentOrderItemDto.builder()
                .orderId(order.getId())
                .orderCode(order.getCode())
                .status(order.getStatus().name())
                .statusText(statusText)
                .totalAmount(order.getTotal())
                .totalFormatted(totalFormatted)
                .createdAt(order.getCreatedAt())
                .itemsSummary(itemsSummary)
                .build();
    }

    @Transactional
    public ChatMessageResponse sendOrderCard(Long conversationId, Long staffId, String staffName, Integer orderId, String orderCode) {
        ChatConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên trò chuyện."));

        if (conversation.getStatus() != ConversationStatus.WITH_STAFF) {
            throw new InvalidOperationException("Vui lòng tiếp nhận cuộc trò chuyện trước khi gửi thẻ đơn hàng cho khách.");
        }

        Order order = null;
        if (orderId != null) {
            order = orderRepository.findById(orderId).orElse(null);
        }
        if (order == null && orderCode != null && !orderCode.isBlank()) {
            order = orderRepository.findByCode(orderCode).orElse(null);
        }
        if (order == null) {
            throw new ResourceNotFoundException("Không tìm thấy thông tin đơn hàng.");
        }

        NumberFormat formatter = NumberFormat.getInstance(new Locale("vi", "VN"));
        String totalFormatted = formatter.format(order.getTotal() != null ? order.getTotal() : 0L) + "đ";

        String statusText;
        switch (order.getStatus()) {
            case Pending -> statusText = "Chờ xác nhận";
            case Processing -> statusText = "Đang pha chế";
            case Shipped -> statusText = "Đang giao hàng";
            case Completed -> statusText = "Hoàn thành";
            case Cancelled -> statusText = "Đã hủy";
            default -> statusText = order.getStatus().name();
        }

        String metadataJson = String.format(
                "{\"code\":\"%s\",\"status\":\"%s\",\"statusText\":\"%s\",\"totalFormatted\":\"%s\"}",
                order.getCode(),
                order.getStatus().name(),
                statusText,
                totalFormatted
        );

        String cardSnippet = "Thông tin đơn hàng #" + order.getCode() + " (" + statusText + " - " + totalFormatted + ")";

        ChatMessage cardMsg = ChatMessage.builder()
                .conversation(conversation)
                .senderType(ChatSenderType.STAFF)
                .senderId(staffId)
                .senderName(staffName != null ? staffName : "Nhân viên hỗ trợ")
                .content(cardSnippet)
                .messageType(ChatMessageType.ORDER_CARD)
                .metadataJson(metadataJson)
                .isRead(false)
                .build();

        ChatMessage saved = messageRepository.save(cardMsg);
        conversation.setLastMessageSnippet(cardSnippet);
        conversation.setUnreadCountCustomer(conversation.getUnreadCountCustomer() + 1);
        conversationRepository.save(conversation);

        ChatMessageResponse resp = mapToMessageResponse(saved);
        messagingTemplate.convertAndSend("/topic/conversation/" + conversation.getId(), resp);

        return resp;
    }

    private ChatConversationResponse mapToConversationResponse(ChatConversation c) {
        return ChatConversationResponse.builder()
                .id(c.getId())
                .sessionId(c.getSessionId())
                .userId(c.getUser() != null ? c.getUser().getId() : null)
                .storeId(c.getStore() != null ? c.getStore().getId() : null)
                .storeName(c.getStore() != null ? c.getStore().getName() : null)
                .customerName(c.getCustomerName())
                .customerPhone(c.getCustomerPhone())
                .status(c.getStatus())
                .handoverReason(c.getHandoverReason())
                .assignedStaffId(c.getAssignedStaff() != null ? c.getAssignedStaff().getId() : null)
                .assignedStaffName(c.getAssignedStaff() != null ? c.getAssignedStaff().getFullName() : null)
                .lastMessageSnippet(c.getLastMessageSnippet())
                .unreadCountStaff(c.getUnreadCountStaff())
                .unreadCountCustomer(c.getUnreadCountCustomer())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private ChatMessageResponse mapToMessageResponse(ChatMessage m) {
        return ChatMessageResponse.builder()
                .id(m.getId())
                .conversationId(m.getConversation().getId())
                .senderType(m.getSenderType())
                .senderId(m.getSenderId())
                .senderName(m.getSenderName())
                .content(m.getContent())
                .messageType(m.getMessageType())
                .metadataJson(m.getMetadataJson())
                .isRead(m.isRead())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
