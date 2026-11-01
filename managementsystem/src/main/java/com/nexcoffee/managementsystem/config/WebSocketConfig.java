package com.nexcoffee.managementsystem.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Cổng kết nối WebSocket với SockJS fallback cho mọi trình duyệt
        registry.addEndpoint("/ws-chat")
                .setAllowedOriginPatterns("*")
                .withSockJS();

        // Cổng kết nối raw WebSocket (không dùng SockJS wrapper)
        registry.addEndpoint("/ws-chat-raw")
                .setAllowedOriginPatterns("*");
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Kênh broker để đẩy tin nhắn về client: /topic (broadcast) và /queue (private)
        registry.enableSimpleBroker("/topic", "/queue");

        // Tiền tố của các request mà client gửi lên server
        registry.setApplicationDestinationPrefixes("/app");
    }
}
