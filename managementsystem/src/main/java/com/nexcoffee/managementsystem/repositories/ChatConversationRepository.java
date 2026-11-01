package com.nexcoffee.managementsystem.repositories;

import com.nexcoffee.managementsystem.entities.ChatConversation;
import com.nexcoffee.managementsystem.enums.ConversationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatConversationRepository extends JpaRepository<ChatConversation, Long> {

    Optional<ChatConversation> findBySessionId(String sessionId);

    Optional<ChatConversation> findTopByUserIdOrderByUpdatedAtDesc(Long userId);

    Optional<ChatConversation> findTopBySessionIdOrderByUpdatedAtDesc(String sessionId);

    List<ChatConversation> findByStoreIdOrderByUpdatedAtDesc(Long storeId);

    List<ChatConversation> findByStoreIdAndStatusOrderByUpdatedAtDesc(Long storeId, ConversationStatus status);

    List<ChatConversation> findAllByOrderByUpdatedAtDesc();

    List<ChatConversation> findByStatusOrderByUpdatedAtDesc(ConversationStatus status);

    @Query("SELECT COUNT(c) FROM ChatConversation c WHERE c.store.id = :storeId AND c.status = :status")
    long countByStoreIdAndStatus(@Param("storeId") Long storeId, @Param("status") ConversationStatus status);

    long countByStatus(ConversationStatus status);

    @Query("SELECT COUNT(c) FROM ChatConversation c WHERE c.store.id = :storeId AND (c.status = 'WAITING_STAFF' OR c.status = 'WITH_STAFF')")
    long countActiveSupportByStoreId(@Param("storeId") Long storeId);

    @Query("SELECT COUNT(c) FROM ChatConversation c WHERE c.status = 'WAITING_STAFF' OR c.status = 'WITH_STAFF'")
    long countActiveSupportAll();

    @Query("SELECT c FROM ChatConversation c WHERE " +
           "(:storeId IS NULL OR c.store.id = :storeId) AND " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(" +
           "c.status IN ('WAITING_STAFF', 'WITH_STAFF') " +
           "OR EXISTS (SELECT 1 FROM ChatMessage m WHERE m.conversation = c AND m.senderType = 'CUSTOMER')" +
           ") ORDER BY c.updatedAt DESC")
    List<ChatConversation> findSupportConversations(
            @Param("storeId") Long storeId,
            @Param("status") ConversationStatus status
    );
}
