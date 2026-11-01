package com.nexcoffee.managementsystem.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexcoffee.managementsystem.entities.*;
import com.nexcoffee.managementsystem.enums.ChatMessageType;
import com.nexcoffee.managementsystem.enums.OrderStatus;
import com.nexcoffee.managementsystem.enums.ProductsStatus;
import com.nexcoffee.managementsystem.repositories.OrderRepository;
import com.nexcoffee.managementsystem.repositories.ProductRepository;
import com.nexcoffee.managementsystem.repositories.StoreRepository;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.text.NumberFormat;
import java.time.Duration;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiChatService {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final StoreRepository storeRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-flash-lite-latest}")
    private String preferredModel;

    private static final List<String> FALLBACK_MODELS = List.of(
            "gemini-flash-lite-latest",
            "gemini-3-flash-preview",
            "gemini-3.5-flash",
            "gemini-3.8-flash"
    );

    private static final Pattern ORDER_CODE_PATTERN = Pattern.compile(
            "\\b(NX[0-9]{8,16}[A-Za-z0-9]{4,8}|NEX-[A-Za-z0-9]{6})\\b",
            Pattern.CASE_INSENSITIVE
    );

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BotReply {
        private String content;
        private ChatMessageType messageType;
        private String metadataJson;
    }

    public BotReply generateReply(String userMessage, ChatConversation conversation) {
        if (userMessage == null || userMessage.isBlank()) {
            return BotReply.builder()
                    .content("NexCoffee xin chào bạn! Mình có thể hỗ trợ gì cho bạn hôm nay?")
                    .messageType(ChatMessageType.TEXT)
                    .build();
        }

        String lowerMsg = userMessage.toLowerCase().trim();

        // 1. Kiểm tra nếu khách cung cấp mã đơn hàng
        Matcher orderMatcher = ORDER_CODE_PATTERN.matcher(userMessage);
        if (orderMatcher.find()) {
            String orderCode = orderMatcher.group(1).toUpperCase();
            return handleOrderLookup(orderCode, conversation);
        }

        // 2. Nếu khách hỏi "kiểm tra đơn", "đơn hàng của tôi" mà chưa có mã
        if ((lowerMsg.contains("đơn hàng") || lowerMsg.contains("kiểm tra đơn") || lowerMsg.contains("tra cứu đơn") || lowerMsg.contains("đơn của tôi"))
                && !lowerMsg.contains("menu") && !lowerMsg.contains("món")) {
            return BotReply.builder()
                    .content("Để kiểm tra tiến độ đơn hàng, bạn vui lòng nhắn giúp mình Mã đơn hàng trực tuyến (ví dụ: NX...). Mình sẽ tra cứu ngay cho bạn.")
                    .messageType(ChatMessageType.TEXT)
                    .build();
        }

        // 3. Nếu cấu hình Gemini API Key hợp lệ -> Gọi Gemini Flash
        if (geminiApiKey != null && !geminiApiKey.isBlank() && !geminiApiKey.startsWith("YOUR_")) {
            try {
                BotReply geminiReply = callGeminiApi(userMessage, conversation);
                if (geminiReply != null && geminiReply.getContent() != null && !geminiReply.getContent().isBlank()) {
                    return geminiReply;
                }
            } catch (Exception ex) {
                log.warn("Gemini API call failed, falling back to rule-based engine: {}", ex.getMessage());
            }
        }

        // 4. Fallback Rule-Based Engine thông minh
        return generateRuleBasedReply(lowerMsg, userMessage);
    }

    private BotReply handleOrderLookup(String orderCode, ChatConversation conversation) {
        Optional<Order> orderOpt = orderRepository.findByCode(orderCode);
        if (orderOpt.isEmpty()) {
            return BotReply.builder()
                    .content("Hệ thống chưa tìm thấy đơn hàng với mã " + orderCode + ". Bạn vui lòng kiểm tra lại mã đơn hoặc bấm nút 'Gặp nhân viên tư vấn' để được hỗ trợ nhé.")
                    .messageType(ChatMessageType.TEXT)
                    .build();
        }

        Order order = orderOpt.get();

        // 1. Chặn hoàn toàn đơn hàng bán tại quầy / pha chế POS (NEX-...)
        boolean isPosOrder = (order.getCode() != null && order.getCode().toUpperCase().startsWith("NEX-"))
                || order.getAddress() == null
                || (order.getStaff() != null && order.getUser() == null);

        if (isPosOrder) {
            return BotReply.builder()
                    .content("Mã đơn " + order.getCode() + " là đơn bán và pha chế trực tiếp tại quầy của cửa hàng. " +
                            "Hệ thống chat chỉ hỗ trợ tra cứu các đơn hàng đặt trực tuyến giao hàng (bắt đầu bằng NX...). " +
                            "Nếu bạn cần kiểm tra hóa đơn hoặc dịch vụ tại quán, bạn vui lòng liên hệ nhân viên tại quầy nhé.")
                    .messageType(ChatMessageType.TEXT)
                    .build();
        }

        // 2. Chặn khách vãng lai (Guest chưa đăng nhập)
        boolean isLoggedIn = (conversation != null && conversation.getUser() != null);
        if (!isLoggedIn) {
            return BotReply.builder()
                    .content("Bạn chưa đăng nhập tài khoản. Để bảo mật thông tin đơn hàng và thông tin cá nhân, bạn vui lòng đăng nhập tài khoản đã đặt hàng trước khi tra cứu nhé.")
                    .messageType(ChatMessageType.TEXT)
                    .build();
        }

        // 3. Kiểm tra quyền sở hữu đơn hàng (chỉ cho phép xem đơn hàng của chính tài khoản đang đăng nhập)
        boolean isOrderOwner = (order.getUser() != null && order.getUser().getId().equals(conversation.getUser().getId()));
        if (!isOrderOwner) {
            return BotReply.builder()
                    .content("Đơn hàng " + order.getCode() + " không thuộc tài khoản hiện tại của bạn. Bạn vui lòng đăng nhập đúng tài khoản đã đặt đơn nhé.")
                    .messageType(ChatMessageType.TEXT)
                    .build();
        }

        // 4. Đã đăng nhập và đúng chủ đơn hàng -> Hiển thị chi tiết
        NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(new Locale("vi", "VN"));
        String totalFormatted = currencyFormat.format(order.getTotal() != null ? order.getTotal() : 0);
        String statusDesc = formatOrderStatus(order);

        StringBuilder sb = new StringBuilder();
        sb.append("Thông tin đơn hàng ").append(order.getCode()).append("\n");
        sb.append("• Trạng thái: ").append(statusDesc).append("\n");
        sb.append("• Tổng tiền: ").append(totalFormatted).append("\n");
        sb.append("• Hình thức: ").append(order.getPaymentMethod() != null ? order.getPaymentMethod().name() : "COD").append("\n");
        if (order.getAddress() != null && !order.getAddress().isBlank()) {
            sb.append("• Địa chỉ giao: ").append(order.getAddress()).append("\n");
        }

        Map<String, Object> orderCard = new HashMap<>();
        orderCard.put("id", order.getId());
        orderCard.put("code", order.getCode());
        orderCard.put("status", order.getStatus().name());
        orderCard.put("statusText", statusDesc);
        orderCard.put("total", order.getTotal());
        orderCard.put("totalFormatted", totalFormatted);
        orderCard.put("createdAt", order.getCreatedAt() != null ? order.getCreatedAt().toString() : "");

        String metadataJson = null;
        try {
            metadataJson = objectMapper.writeValueAsString(orderCard);
        } catch (Exception ignored) {}

        return BotReply.builder()
                .content(sb.toString())
                .messageType(ChatMessageType.ORDER_CARD)
                .metadataJson(metadataJson)
                .build();
    }

    private String formatOrderStatus(Order order) {
        if (order.getStatus() == null) return "Không xác định";
        switch (order.getStatus()) {
            case Pending:
                return "Đang chờ cửa hàng xác nhận";
            case Processing:
                return "Đang pha chế / Chuẩn bị món";
            case Shipped:
                return "Đang giao hàng" + (order.getShipper() != null ? (" (Shipper: " + order.getShipper().getFullName() + ")") : "");
            case Completed:
                return "Đã hoàn thành thành công";
            case Cancelled:
                return "Đã hủy" + (order.getCancelReason() != null ? (" (" + order.getCancelReason() + ")") : "");
            default:
                return order.getStatus().name();
        }
    }

    private BotReply callGeminiApi(String userMessage, ChatConversation conversation) throws Exception {
        List<Product> products = productRepository.findByStatusAndDeletedFalseOrderByIdDesc(ProductsStatus.active);
        String productContext = products.stream()
                .limit(15)
                .map(p -> {
                    Double price = (p.getVariants() != null && !p.getVariants().isEmpty()) ? p.getVariants().get(0).getPrice() : null;
                    return p.getName() + (price != null ? " (" + Math.round(price) + "đ)" : "");
                })
                .collect(Collectors.joining(", "));

        List<Store> stores = storeRepository.findAll();
        String storeContext = stores.stream()
                .map(s -> s.getName() + ": " + s.getAddress())
                .collect(Collectors.joining("; "));

        String systemPrompt = "Bạn là Trợ lý ảo AI thân thiện của chuỗi cà phê NexCoffee. " +
                "Hãy xưng là 'NexCoffee' hoặc 'mình', gọi khách là 'bạn'. Giọng điệu lịch sự, hiếu khách, rõ ràng. " +
                "QUY TẮC BẮT BUỘC: " +
                "1. Tuyệt đối không dùng từ 'Dạ' ở đầu câu và không dùng từ 'ạ' ở cuối câu. " +
                "2. Tuyệt đối không sử dụng ký tự đánh dấu markdown như '**' trong nội dung trả lời. " +
                "3. Khi gợi ý đồ uống hoặc món ăn, hãy dùng ĐÚNG TÊN các món có trong Menu dưới đây để hệ thống hiển thị liên kết xem chi tiết: " + productContext + ". " +
                "Thông tin Chi nhánh: " + storeContext + ". " +
                "Nếu khách hỏi món, hãy gợi ý nhiệt tình, giải thích hương vị ngắn gọn và nêu rõ giá món. " +
                "Nếu khách có vấn đề về đổi trả hoặc khiếu nại, hãy nhắc khách có thể bấm nút 'Gặp nhân viên tư vấn' để nhân viên quầy hỗ trợ trực tiếp. " +
                "Trả lời súc tích dưới 120 từ bằng tiếng Việt.";

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("systemInstruction", Map.of("parts", List.of(Map.of("text", systemPrompt))));
        requestBody.put("contents", List.of(
                Map.of("role", "user", "parts", List.of(Map.of("text", userMessage)))
        ));
        requestBody.put("generationConfig", Map.of(
                "maxOutputTokens", 600,
                "temperature", 0.7
        ));

        String jsonPayload = objectMapper.writeValueAsString(requestBody);

        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();

        List<String> modelsToTry = new ArrayList<>();
        if (preferredModel != null && !preferredModel.isBlank()) {
            modelsToTry.add(preferredModel.trim());
        }
        for (String m : FALLBACK_MODELS) {
            if (!modelsToTry.contains(m)) {
                modelsToTry.add(m);
            }
        }

        for (String modelName : modelsToTry) {
            long startTime = System.currentTimeMillis();
            try {
                String url = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + geminiApiKey;

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header("Content-Type", "application/json")
                        .timeout(Duration.ofSeconds(12))
                        .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                        .build();

                HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
                long elapsed = System.currentTimeMillis() - startTime;

                if (response.statusCode() == 200) {
                    JsonNode root = objectMapper.readTree(response.body());
                    JsonNode textNode = root.at("/candidates/0/content/parts/0/text");
                    if (!textNode.isMissingNode()) {
                        String replyContent = textNode.asText().trim();
                        replyContent = cleanPoliteTone(replyContent);
                        log.info("Gemini [{}] replied successfully in {}ms (length: {})", modelName, elapsed, replyContent.length());

                        List<Map<String, Object>> suggestedProducts = extractSuggestedProducts(replyContent, products);
                        String metadataJson = null;
                        ChatMessageType type = ChatMessageType.TEXT;
                        if (!suggestedProducts.isEmpty()) {
                            type = ChatMessageType.PRODUCT_CARD;
                            try {
                                metadataJson = objectMapper.writeValueAsString(suggestedProducts);
                            } catch (Exception ignored) {}
                        }

                        return BotReply.builder()
                                .content(replyContent)
                                .messageType(type)
                                .metadataJson(metadataJson)
                                .build();
                    }
                } else {
                    log.warn("Gemini model [{}] failed with status {} in {}ms: {}", modelName, response.statusCode(), elapsed, response.body());
                }
            } catch (Exception ex) {
                long elapsed = System.currentTimeMillis() - startTime;
                log.warn("Gemini model [{}] exception in {}ms: {}", modelName, elapsed, ex.getMessage());
            }
        }

        return null;
    }

    private String cleanPoliteTone(String text) {
        if (text == null) return "";
        return text.replace("**", "")
                .replaceAll("(?i)<think>[\\s\\S]*?</think>", "")
                .replaceAll("(?m)^\\s*\\*\\s+", "• ")
                .replaceAll("^(?i)dạ,\\s*", "")
                .replaceAll("^(?i)dạ\\s+", "")
                .replaceAll("(?i)\\s+ạ([.!?])", "$1")
                .replaceAll("(?i)\\s+ạ$", "")
                .trim();
    }

    private List<Map<String, Object>> extractSuggestedProducts(String text, List<Product> products) {
        if (text == null || text.isBlank() || products == null || products.isEmpty()) {
            return Collections.emptyList();
        }

        String lowerText = text.toLowerCase();
        List<Map<String, Object>> suggested = new ArrayList<>();
        Set<Integer> addedIds = new HashSet<>();

        // Sắp xếp các món theo độ dài tên giảm dần để ưu tiên khớp tên dài trước
        List<Product> sortedProducts = new ArrayList<>(products);
        sortedProducts.sort((a, b) -> Integer.compare(b.getName().length(), a.getName().length()));

        for (Product p : sortedProducts) {
            if (p.getName() == null || p.getName().isBlank()) continue;
            String lowerName = p.getName().toLowerCase().trim();

            if (lowerText.contains(lowerName)) {
                if (!addedIds.contains(p.getId())) {
                    addedIds.add(p.getId());
                    Double price = (p.getVariants() != null && !p.getVariants().isEmpty())
                            ? p.getVariants().get(0).getPrice()
                            : null;
                    String imgUrl = (p.getImages() != null && !p.getImages().isEmpty())
                            ? p.getImages().get(0).getImageUrl()
                            : null;

                    Map<String, Object> card = new HashMap<>();
                    card.put("id", p.getId());
                    card.put("name", p.getName());
                    card.put("price", price);
                    card.put("imageUrl", imgUrl);
                    card.put("description", p.getDescription());
                    suggested.add(card);

                    if (suggested.size() >= 4) {
                        break;
                    }
                }
            }
        }

        return suggested;
    }

    private BotReply generateRuleBasedReply(String lowerMsg, String rawMsg) {
        // 1. Ưu tiên: Hỏi về địa chỉ / chi nhánh / cửa hàng (đặt trước chào hỏi để tránh 'chi' khớp nhầm với 'hi')
        if (lowerMsg.contains("chi nhánh") || lowerMsg.contains("địa chỉ") || lowerMsg.contains("ở đâu") || lowerMsg.contains("cửa hàng") || lowerMsg.contains("quán ở")) {
            List<Store> stores = storeRepository.findAll();
            StringBuilder sb = new StringBuilder("Hiện tại NexCoffee có các chi nhánh phục vụ bạn:\n");
            for (Store s : stores) {
                sb.append("• ").append(s.getName()).append(": ").append(s.getAddress());
                if (s.getPhone() != null && !s.getPhone().isBlank()) {
                    sb.append(" (Hotline: ").append(s.getPhone()).append(")");
                }
                sb.append("\n");
            }
            sb.append("\nQuán mở cửa từ 07:00 đến 22:30 mỗi ngày, rất hân hạnh được đón tiếp bạn!");
            return BotReply.builder()
                    .content(sb.toString())
                    .messageType(ChatMessageType.TEXT)
                    .build();
        }

        // 2. Chào hỏi (sử dụng regex boundary \\b để không khớp nhầm 'chi nhánh' hay 'thích')
        if (lowerMsg.matches(".*\\b(chào|xin chào|hello|hey|alo)\\b.*") || lowerMsg.equals("hi") || lowerMsg.startsWith("hi ") || lowerMsg.endsWith(" hi")) {
            return BotReply.builder()
                    .content("NexCoffee xin chào bạn! Chúc bạn một ngày tràn đầy năng lượng ☕. Hôm nay bạn muốn khám phá đồ uống nào của NexCoffee hay cần kiểm tra đơn hàng?")
                    .messageType(ChatMessageType.TEXT)
                    .build();
        }

        // 3. Hỏi về menu / món ngon / gợi ý / bán chạy
        if (lowerMsg.contains("menu") || lowerMsg.contains("món") || lowerMsg.contains("uống") || lowerMsg.contains("gợi ý") || lowerMsg.contains("ngon") || lowerMsg.contains("bán chạy")) {
            List<Product> products = productRepository.findTop4ByStatusAndDeletedFalseOrderBySoldCountDescIdDesc(ProductsStatus.active);
            if (products.isEmpty()) {
                products = productRepository.findByStatusAndDeletedFalseOrderByIdDesc(ProductsStatus.active);
            }

            StringBuilder sb = new StringBuilder("NexCoffee xin giới thiệu đến bạn các món Signature & Bán chạy nhất hiện nay:\n");
            List<Map<String, Object>> productCards = new ArrayList<>();

            for (Product p : products.stream().limit(3).collect(Collectors.toList())) {
                Double price = (p.getVariants() != null && !p.getVariants().isEmpty()) ? p.getVariants().get(0).getPrice() : null;
                String imgUrl = (p.getImages() != null && !p.getImages().isEmpty()) ? p.getImages().get(0).getImageUrl() : null;

                sb.append("• ").append(p.getName());
                if (price != null) {
                    sb.append(" - ").append(NumberFormat.getCurrencyInstance(new Locale("vi", "VN")).format(price));
                }
                sb.append("\n");

                Map<String, Object> card = new HashMap<>();
                card.put("id", p.getId());
                card.put("name", p.getName());
                card.put("price", price);
                card.put("imageUrl", imgUrl);
                card.put("description", p.getDescription());
                productCards.add(card);
            }

            sb.append("\nBạn có thể nhấn vào thẻ món để xem chi tiết hoặc đặt ngay nhé!");

            String metadataJson = null;
            try {
                metadataJson = objectMapper.writeValueAsString(productCards);
            } catch (Exception ignored) {}

            return BotReply.builder()
                    .content(sb.toString())
                    .messageType(ChatMessageType.PRODUCT_CARD)
                    .metadataJson(metadataJson)
                    .build();
        }

        // 4. Mặc định phản hồi thân thiện và nhắc gặp nhân viên nếu cần
        return BotReply.builder()
                .content("NexCoffee đã ghi nhận tin nhắn của bạn. Bạn có thể nhắn mã đơn hàng (NX...) để mình tra cứu tiến độ, hoặc nhắn câu hỏi về Menu nhé!\n\n" +
                        "👉 Nếu bạn cần hỗ trợ sự cố đơn hàng hoặc tư vấn chi tiết hơn, bạn có thể bấm nút 'Gặp nhân viên tư vấn' bên dưới để kết nối trực tiếp với nhân viên quầy.")
                .messageType(ChatMessageType.TEXT)
                .build();
    }
}
