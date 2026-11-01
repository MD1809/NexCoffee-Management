import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Client } from "@stomp/stompjs";
import { toast } from "react-toastify";
import { getCurrentUser } from "../../../utils/authStorage";
import coffeeCup from "../../../assets/hero/coffee-cup.svg";
import chatApi from "../../../apis/chatApi";
import "./customerChatWidget.css";

const HANDOVER_REASONS = [
  { id: "ORDER_ISSUE", label: "Sự cố đơn hàng / Giao trễ", isUrgent: true },
  { id: "PAYMENT_ISSUE", label: "Vấn đề thanh toán / Hoàn tiền", isUrgent: false },
  { id: "COMPLAINT", label: "Khiếu nại đồ uống / Phục vụ", isUrgent: true },
  { id: "BULK_CATERING", label: "Tư vấn tiệc / Số lượng lớn", isUrgent: false },
  { id: "OTHER", label: "Tư vấn chung khác", isUrgent: false },
];

const BACKEND_URL = "http://localhost:8080";

const getImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;
  if (imagePath.startsWith("/images")) return `${BACKEND_URL}${imagePath}`;
  if (imagePath.startsWith("images")) return `${BACKEND_URL}/${imagePath}`;
  return `${BACKEND_URL}/images/${imagePath}`;
};

const STORAGE_SESSION_KEY = "nexcoffee_chat_session_id";

export default function CustomerChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [isStaffTyping, setIsStaffTyping] = useState(false);
  const [isWaitingStaffResponse, setIsWaitingStaffResponse] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [handoverReason, setHandoverReason] = useState("ORDER_ISSUE");
  const [handoverError, setHandoverError] = useState("");
  const [isSubmittingHandover, setIsSubmittingHandover] = useState(false);
  const [isCalloutOpen, setIsCalloutOpen] = useState(true);

  const messagesEndRef = useRef(null);
  const stompClientRef = useRef(null);
  const staffTypingTimeoutRef = useRef(null);
  const customerTypingTimeoutRef = useRef(null);

  // Khởi tạo hoặc khôi phục session ID
  const getSessionId = () => {
    let sid = localStorage.getItem(STORAGE_SESSION_KEY);
    if (!sid) {
      sid = "sess_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem(STORAGE_SESSION_KEY, sid);
    }
    return sid;
  };

  // Tải session và danh sách tin nhắn ban đầu
  const initChatSession = async () => {
    try {
      setIsLoading(true);
      const sid = getSessionId();
      const currentUser = getCurrentUser();
      const res = await chatApi.initConversation({
        sessionId: sid,
        userId: currentUser?.id || null,
        customerName: currentUser?.fullName || currentUser?.name || null,
        customerPhone: currentUser?.phone || null,
      });
      if (res.data) {
        setConversation(res.data);
        const msgRes = await chatApi.getMessages(res.data.id);
        if (msgRes.data) {
          setMessages(msgRes.data);
        }
      }
    } catch (err) {
      console.error("Lỗi khi tải phiên chat:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Đồng bộ / tải lại danh sách tin nhắn từ server mà không làm mất lịch sử hội thoại
  const handleRefreshMessages = async () => {
    if (!conversation?.id || isSyncing) return;
    try {
      setIsSyncing(true);
      const msgRes = await chatApi.getMessages(conversation.id);
      if (msgRes.data) {
        setMessages(msgRes.data);
      }
    } catch (err) {
      console.error("Lỗi khi đồng bộ tin nhắn:", err);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  // Chuyển từ hàng chờ nhân viên quay lại trợ lý AI
  const handleReturnToBot = async () => {
    if (!conversation) return;
    try {
      const res = await chatApi.returnToBot(conversation.id);
      if (res.data) {
        setConversation(res.data);
      }
      setIsStaffTyping(false);
      setIsWaitingStaffResponse(false);
    } catch (err) {
      console.error("Lỗi khi quay lại Bot:", err);
    }
  };

  useEffect(() => {
    initChatSession();
  }, []);

  // Thiết lập WebSocket STOMP listener cho conversation hiện tại
  useEffect(() => {
    if (!conversation?.id) return;

    const wsHost = window.location.hostname || "localhost";
    const brokerURL = (window.location.protocol === "https:" ? "wss://" : "ws://") + wsHost + ":8080/ws-chat-raw";

    const stompClient = new Client({
      brokerURL,
      reconnectDelay: 3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onWebSocketError: () => {},
      onStompError: () => {},
      debug: () => {},
    });

    stompClient.onConnect = () => {
      // 1. Lắng nghe tin nhắn mới hoặc cập nhật trạng thái hội thoại
      stompClient.subscribe(`/topic/conversation/${conversation.id}`, (messageFrame) => {
        try {
          const payload = JSON.parse(messageFrame.body);

          // Nếu đây là payload cập nhật trạng thái hội thoại (ChatConversationResponse)
          if (payload.status && !payload.senderType) {
            setConversation(payload);
            if (payload.status === "BOT") {
              setIsStaffTyping(false);
              setIsWaitingStaffResponse(false);
            }
            return;
          }

          const newMsg = payload;
          setMessages((prev) => {
            // Tránh thêm trùng id
            if (newMsg.id && prev.some((m) => String(m.id) === String(newMsg.id))) {
              return prev;
            }

            // Nếu là tin nhắn của CUSTOMER vừa được lưu trên DB, thay thế temp msg tương ứng
            if (newMsg.senderType === "CUSTOMER") {
              const tempIndex = prev.findIndex((m) => String(m.id).startsWith("temp_"));
              if (tempIndex !== -1) {
                const updated = [...prev];
                updated[tempIndex] = newMsg;
                return updated;
              }
            }

            return [...prev, newMsg];
          });

          // Cập nhật trạng thái hội thoại và tắt trạng thái chờ
          if (newMsg.senderType === "STAFF") {
            setConversation((prev) => (prev ? { ...prev, status: "WITH_STAFF" } : prev));
            setIsStaffTyping(false);
            setIsWaitingStaffResponse(false);
          }
          if (newMsg.senderType === "BOT") {
            setIsBotThinking(false);
          }

          if (!isOpen) {
            setUnreadCount((c) => c + 1);
            setIsCalloutOpen(true);
          }
          setIsBotThinking(false);
        } catch (e) {
          console.error("Lỗi xử lý tin nhắn socket:", e);
        }
      });

      // 2. Lắng nghe tín hiệu nhân viên đang soạn tin (Typing Indicator)
      stompClient.subscribe(`/topic/conversation/${conversation.id}/typing`, (typingFrame) => {
        try {
          const data = JSON.parse(typingFrame.body);
          if (data.senderType === "STAFF") {
            const typing = Boolean(data.isTyping);
            setIsStaffTyping(typing);
            if (typing) {
              setIsWaitingStaffResponse(false);
              if (staffTypingTimeoutRef.current) clearTimeout(staffTypingTimeoutRef.current);
              staffTypingTimeoutRef.current = setTimeout(() => {
                setIsStaffTyping(false);
              }, 4000);
            }
          }
        } catch (e) {}
      });
    };

    stompClient.activate();
    stompClientRef.current = stompClient;

    return () => {
      if (staffTypingTimeoutRef.current) clearTimeout(staffTypingTimeoutRef.current);
      if (customerTypingTimeoutRef.current) clearTimeout(customerTypingTimeoutRef.current);
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [conversation?.id, isOpen]);

  // Cuộn xuống cuối mỗi khi có tin nhắn mới hoặc thay đổi trạng thái gõ
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setUnreadCount(0);
    }
  }, [messages, isOpen, isBotThinking, isStaffTyping, isWaitingStaffResponse]);

  // Xử lý gửi tín hiệu khi khách hàng gõ bàn phím
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputVal(val);

    if (conversation?.id && (conversation.status === "WITH_STAFF" || conversation.status === "WAITING_STAFF")) {
      if (stompClientRef.current?.connected) {
        try {
          stompClientRef.current.publish({
            destination: "/app/chat.typing",
            body: JSON.stringify({
              conversationId: conversation.id,
              senderType: "CUSTOMER",
              isTyping: true,
            }),
          });

          if (customerTypingTimeoutRef.current) clearTimeout(customerTypingTimeoutRef.current);
          customerTypingTimeoutRef.current = setTimeout(() => {
            if (stompClientRef.current?.connected) {
              stompClientRef.current.publish({
                destination: "/app/chat.typing",
                body: JSON.stringify({
                  conversationId: conversation.id,
                  senderType: "CUSTOMER",
                  isTyping: false,
                }),
              });
            }
          }, 2500);
        } catch {}
      }
    }
  };

  // Gửi tin nhắn
  const handleSendMessage = async (customText = null) => {
    const textToSend = (customText !== null ? customText : inputVal).trim();
    if (!textToSend || !conversation) return;

    if (customText === null) {
      setInputVal("");
    }

    // Hiển thị tạm tin nhắn khách hàng (optimistic UI)
    const tempUserMsg = {
      id: "temp_" + Date.now(),
      conversationId: conversation.id,
      senderType: "CUSTOMER",
      content: textToSend,
      messageType: "TEXT",
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    // Nếu cuộc trò chuyện là BOT hoặc CLOSED (server sẽ tự động kích hoạt lại sang BOT)
    if (conversation.status === "BOT" || conversation.status === "CLOSED") {
      setIsBotThinking(true);
      if (conversation.status === "CLOSED") {
        setConversation((prev) => (prev ? { ...prev, status: "BOT" } : prev));
      }
    } else {
      // Đang kết nối với nhân viên quầy
      setIsWaitingStaffResponse(true);
    }

    try {
      const res = await chatApi.sendCustomerMessage({
        conversationId: conversation.id,
        senderType: "CUSTOMER",
        content: textToSend,
        messageType: "TEXT",
      });

      // Nếu API trả về phản hồi từ Bot
      if (res.data && res.data.senderType === "BOT") {
        setMessages((prev) => {
          if (res.data.id && prev.some((m) => String(m.id) === String(res.data.id))) {
            return prev;
          }
          return [...prev, res.data];
        });
      }
    } catch (err) {
      console.error("Lỗi gửi tin nhắn:", err);
    } finally {
      setIsBotThinking(false);
    }
  };

  // Kiểm tra thời gian hồi (cooldown) để chống spam
  const checkCooldownRemaining = () => {
    const lastTime = localStorage.getItem("nexcoffee_handover_cooldown");
    if (!lastTime) return 0;
    const elapsed = Date.now() - parseInt(lastTime, 10);
    const cooldownMs = 180 * 1000; // 3 phút
    if (elapsed < cooldownMs) {
      return Math.ceil((cooldownMs - elapsed) / 1000);
    }
    return 0;
  };

  // Mở modal kết nối nhân viên (áp dụng kiểm tra spam & cooldown)
  const handleRequestStaff = () => {
    if (!conversation) return;

    const remaining = checkCooldownRemaining();
    if (remaining > 0) {
      toast.warning(
        `Bạn vừa gửi yêu cầu hỗ trợ. Vui lòng chờ ${remaining}s hoặc tiếp tục trò chuyện cùng trợ lý AI.`
      );
      return;
    }

    const currentUser = getCurrentUser();
    const initialName =
      currentUser?.fullName ||
      currentUser?.name ||
      (conversation.customerName && !conversation.customerName.startsWith("Khách")
        ? conversation.customerName
        : "");
    const initialPhone = currentUser?.phone || conversation.customerPhone || "";

    setGuestName(initialName);
    setGuestPhone(initialPhone);
    setHandoverReason("ORDER_ISSUE");
    setHandoverError("");
    setShowHandoverModal(true);
  };

  // Xử lý gửi yêu cầu kết nối với lý do và SĐT hợp lệ
  const handleSubmitHandoverModal = async (e) => {
    e.preventDefault();

    if (!guestName.trim() || guestName.trim().length < 2) {
      setHandoverError("Vui lòng nhập họ và tên của bạn (tối thiểu 2 ký tự).");
      return;
    }

    const cleanedPhone = (guestPhone || "").replace(/\s+/g, "");
    if (!cleanedPhone) {
      setHandoverError("Vui lòng nhập số điện thoại để nhân viên liên hệ hỗ trợ.");
      return;
    }

    if (!/^(03|05|07|08|09)\d{8}$/.test(cleanedPhone)) {
      setHandoverError(
        "Số điện thoại không đúng định dạng nhà mạng Việt Nam (yêu cầu 10 chữ số: 03x, 05x, 07x, 08x, 09x)."
      );
      return;
    }

    const spamPhones = ["0123456789", "0987654321", "0999999999", "0000000000"];
    if (spamPhones.includes(cleanedPhone)) {
      setHandoverError("Số điện thoại không hợp lệ. Vui lòng kiểm tra lại.");
      return;
    }

    try {
      setIsSubmittingHandover(true);
      const res = await chatApi.requestHandover(conversation.id, {
        customerName: guestName.trim(),
        customerPhone: cleanedPhone,
        reason: handoverReason,
      });
      if (res.data) {
        setConversation(res.data);
        localStorage.setItem("nexcoffee_handover_cooldown", String(Date.now()));
        setShowHandoverModal(false);
        toast.success("Đã gửi yêu cầu kết nối! Nhân viên sẽ hỗ trợ bạn sớm nhất.");
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.message || err.message || "Không thể kết nối nhân viên.";
      setHandoverError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmittingHandover(false);
    }
  };

  // Để lại lời nhắn ngoại tuyến nếu nhân viên chưa kịp phản hồi
  const handleLeaveOfflineNote = async () => {
    if (!conversation) return;
    const phone = conversation.customerPhone || guestPhone || "";
    const reasonObj = HANDOVER_REASONS.find((r) => r.id === handoverReason);
    const reasonText = conversation.handoverReason || reasonObj?.label || "Cần tư vấn";

    const noteContent = `Khách hàng để lại lời nhắn: Cần hỗ trợ trực tiếp [${reasonText}]${
      phone ? ` qua SĐT: ${phone}` : ""
    }. Đã quay lại trò chuyện với trợ lý AI.`;

    try {
      await chatApi.sendCustomerMessage({
        conversationId: conversation.id,
        senderType: "CUSTOMER",
        content: noteContent,
        messageType: "TEXT",
      });
      await handleReturnToBot();
      toast.info("Đã ghi nhận lời nhắn! Nhân viên sẽ gọi lại số " + (phone || "của bạn") + " sớm nhất.");
    } catch (err) {
      console.error("Lỗi để lại lời nhắn:", err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const parseJsonSafe = (jsonStr) => {
    try {
      return JSON.parse(jsonStr);
    } catch {
      return null;
    }
  };

  return (
    <div className="customer-chat-widget">
      {/* Floating Launcher Button & Callout Notification */}
      {!isOpen && (
        <div className="chat-launcher-container">
          {isCalloutOpen ? (
            <div
              className="chat-launcher-callout"
              onClick={() => {
                setIsOpen(true);
                setUnreadCount(0);
              }}
              role="region"
              aria-label="Thông báo hỗ trợ khách hàng"
            >
              <button
                type="button"
                className="chat-callout-close-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCalloutOpen(false);
                }}
                aria-label="Thu gọn thông báo"
                title="Thu gọn"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>

              <div className="chat-callout-header">
                <span className="chat-callout-badge-dot" />
                <span className="chat-callout-title">
                  {unreadCount > 0 ? "Tin nhắn mới từ NexCoffee" : "Hỗ trợ trực tuyến 24/7"}
                </span>
              </div>
              <div className="chat-callout-body">
                {unreadCount > 0
                  ? `Bạn có ${unreadCount} tin nhắn mới chưa đọc. Nhấn để xem ngay!`
                  : "Bạn cần hỗ trợ đặt món hoặc giải đáp thắc mắc? Trò chuyện với NexCoffee ngay!"}
              </div>
              <div className="chat-callout-action">
                <span>{unreadCount > 0 ? "Xem tin nhắn" : "Bắt đầu chat"}</span>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                </svg>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="chat-callout-toggle-pill"
              onClick={() => setIsCalloutOpen(true)}
              aria-label="Mở dòng thông báo hỗ trợ"
              title="Mở lời nhắc hỗ trợ"
            >
              <span className="chat-callout-toggle-dot" />
              <span>Cần hỗ trợ?</span>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
              </svg>
            </button>
          )}

          <button
            className="chat-launcher-btn"
            onClick={() => {
              setIsOpen(true);
              setUnreadCount(0);
            }}
            aria-label="Mở cửa sổ hỗ trợ trực tuyến"
            title="Mở cửa sổ hỗ trợ trực tuyến"
          >
            {/* SVG Chat Bubble Icon */}
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
            </svg>
            {unreadCount > 0 && <span className="chat-launcher-badge">{unreadCount}</span>}
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window" role="dialog" aria-label="Khung trò chuyện NexCoffee">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-avatar-wrapper">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A2.5 2.5 0 0 0 5 15.5 2.5 2.5 0 0 0 7.5 18a2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 7.5 13m9 0a2.5 2.5 0 0 0-2.5 2.5 2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0 2.5-2.5 2.5 2.5 0 0 0-2.5-2.5z" />
                </svg>
                <span className="online-dot" />
              </div>
              <div>
                <h3 className="chat-header-title">NexCoffee Support</h3>
                <p className="chat-header-status">
                  {conversation?.status === "WAITING_STAFF"
                    ? "Đang kết nối nhân viên..."
                    : conversation?.status === "WITH_STAFF"
                    ? "Nhân viên hỗ trợ trực tiếp"
                    : "Trợ lý AI 24/7 sẵn sàng"}
                </p>
              </div>
            </div>

            <div className="chat-header-actions">
              <button
                onClick={handleRefreshMessages}
                disabled={isSyncing}
                title="Tải lại tin nhắn"
                aria-label="Tải lại tin nhắn"
                className={isSyncing ? "chat-refresh-btn spinning" : "chat-refresh-btn"}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                </svg>
              </button>
              <button onClick={() => setIsOpen(false)} aria-label="Đóng hội thoại">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Status Banner & Staff Handover Button */}
          {conversation?.status === "BOT" && (
            <div className="chat-status-banner bot">
              <span>Cần khiếu nại hoặc tư vấn món riêng?</span>
              <button className="chat-handover-btn" onClick={handleRequestStaff}>
                Gặp nhân viên
              </button>
            </div>
          )}

          {conversation?.status === "WAITING_STAFF" && (
            <div className="chat-status-banner waiting">
              <div className="chat-waiting-info">
                <span className="chat-waiting-dot" />
                <div className="chat-waiting-text-wrap">
                  <span className="chat-waiting-title">Đang kết nối nhân viên tư vấn...</span>
                  {conversation.handoverReason && (
                    <span className="chat-waiting-reason-tag">
                      {conversation.handoverReason}
                    </span>
                  )}
                </div>
              </div>
              <div className="chat-waiting-actions">
                <button
                  type="button"
                  className="chat-handover-btn-note"
                  onClick={handleLeaveOfflineNote}
                  title="Để lại lời nhắn và quay lại chat với AI"
                >
                  Để lại lời nhắn
                </button>
                <button
                  type="button"
                  className="chat-handover-btn-outline"
                  onClick={handleReturnToBot}
                >
                  Chat với AI
                </button>
              </div>
            </div>
          )}

          {conversation?.status === "WITH_STAFF" && (
            <div className="chat-status-banner staff">
              <span>Nhân viên quầy đang hỗ trợ trực tiếp bạn</span>
              <button className="chat-handover-btn-outline" onClick={handleReturnToBot}>
                Chat với AI
              </button>
            </div>
          )}

          {conversation?.status === "CLOSED" && (
            <div className="chat-status-banner closed">
              <span>Phiên hỗ trợ trước đã hoàn tất. Gửi tin nhắn mới để tiếp tục trò chuyện với AI.</span>
            </div>
          )}

          {/* Messages Body */}
          <div className="chat-messages-container">
            {/* Quick Suggestion Pills */}
            <div className="chat-suggestions">
              <button
                className="chat-suggestion-chip"
                onClick={() => handleSendMessage("Gợi ý cho mình các món bán chạy nhất")}
              >
                Món bán chạy
              </button>
              <button
                className="chat-suggestion-chip"
                onClick={() => handleSendMessage("NexCoffee có những chi nhánh nào?")}
              >
                Địa chỉ chi nhánh
              </button>
              <button
                className="chat-suggestion-chip"
                onClick={() => handleSendMessage("Mình muốn kiểm tra đơn hàng")}
              >
                Kiểm tra đơn hàng
              </button>
            </div>

            {isLoading ? (
              <div className="chat-skeleton-bubble" />
            ) : (
              messages.map((m, idx) => {
                const isCustomer = m.senderType === "CUSTOMER";
                const isBot = m.senderType === "BOT";
                const isStaff = m.senderType === "STAFF";
                const isSystem = m.senderType === "SYSTEM" || m.messageType === "SYSTEM";

                if (isSystem) {
                  let displayContent = m.content;
                  if (displayContent === "Khách hàng đã chuyển về trò chuyện cùng trợ lý AI.") {
                    displayContent = "Bạn đã chuyển về trò chuyện cùng trợ lý AI.";
                  }
                  return (
                    <div key={m.id || idx} className="chat-message-row system">
                      <div className="chat-bubble">{displayContent}</div>
                    </div>
                  );
                }

                const metadata = m.metadataJson ? parseJsonSafe(m.metadataJson) : null;

                const itemKey = m.id ? `msg-${m.id}` : `temp-${idx}-${m.createdAt || ""}`;

                return (
                  <div
                    key={itemKey}
                    className={`chat-message-row ${
                      isCustomer ? "customer" : isStaff ? "staff" : "bot"
                    }`}
                  >
                    <span className="chat-sender-tag">
                      {isCustomer ? "Bạn" : isStaff ? "Nhân viên NexCoffee" : "NexCoffee AI"}
                    </span>

                    <div className="chat-bubble">
                      <div style={{ whiteSpace: "pre-line" }}>
                        {m.content ? m.content.replace(/\*\*/g, "") : ""}
                      </div>

                      {/* Render Order Card */}
                      {m.messageType === "ORDER_CARD" && metadata && (
                        <div className="chat-order-card">
                          <div className="chat-order-code">Đơn hàng #{metadata.code}</div>
                          <div className="chat-order-badge">{metadata.statusText || metadata.status}</div>
                          <div className="chat-order-total">{metadata.totalFormatted}</div>
                        </div>
                      )}

                      {/* Render Product Cards với liên kết trực tiếp tới trang chi tiết món */}
                      {(m.messageType === "PRODUCT_CARD" || (metadata && Array.isArray(metadata) && metadata.length > 0)) && Array.isArray(metadata) && metadata.length > 0 && (
                        <div className="chat-product-cards">
                          {metadata.map((item, pIdx) => {
                            const resolvedImg = getImageUrl(item.imageUrl) || coffeeCup;
                            return (
                              <Link
                                to={`/products/${item.id}`}
                                key={item.id ? `card-${item.id}` : `card-idx-${pIdx}`}
                                className="chat-product-item-link"
                                onClick={() => setIsOpen(false)}
                                title={`Xem chi tiết món ${item.name}`}
                              >
                                <div className="chat-product-item">
                                  <img
                                    src={resolvedImg}
                                    alt={item.name}
                                    className="chat-product-img"
                                    loading="lazy"
                                    onError={(e) => {
                                      e.currentTarget.src = coffeeCup;
                                    }}
                                  />
                                  <div className="chat-product-details">
                                    <div className="chat-product-name">{item.name}</div>
                                    <div className="chat-product-price">
                                      {item.price ? Math.round(item.price).toLocaleString("vi-VN") + "đ" : ""}
                                    </div>
                                  </div>
                                  <span className="chat-product-btn">
                                    Xem chi tiết
                                  </span>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <span className="chat-message-time">
                      {m.createdAt
                        ? new Date(m.createdAt).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </div>
                );
              })
            )}

            {/* Trạng thái AI đang soạn phản hồi */}
            {isBotThinking && (
              <div className="chat-message-row bot chat-typing-row" aria-live="polite">
                <span className="chat-sender-tag">NexCoffee AI đang soạn câu trả lời...</span>
                <div className="chat-typing-bubble">
                  <span className="chat-typing-dot" />
                  <span className="chat-typing-dot" />
                  <span className="chat-typing-dot" />
                </div>
              </div>
            )}

            {/* Trạng thái Nhân viên đang soạn tin nhắn hoặc đang chờ nhân viên trả lời */}
            {(isStaffTyping || isWaitingStaffResponse) && conversation?.status === "WITH_STAFF" && (
              <div className="chat-message-row staff chat-typing-row" aria-live="polite">
                <span className="chat-sender-tag">
                  {isStaffTyping ? "Nhân viên đang soạn phản hồi..." : "Đang chờ nhân viên trả lời..."}
                </span>
                <div className="chat-typing-bubble staff">
                  <span className="chat-typing-dot staff" />
                  <span className="chat-typing-dot staff" />
                  <span className="chat-typing-dot staff" />
                </div>
              </div>
            )}

            {/* Thẻ hàng chờ khi đang đợi nhân viên tiếp nhận */}
            {conversation?.status === "WAITING_STAFF" && (
              <div className="chat-waiting-staff-card" aria-live="polite">
                <div className="chat-waiting-staff-header">
                  <span className="chat-pulse-indicator" />
                  <span className="chat-waiting-staff-title">Đang kết nối nhân viên cửa hàng...</span>
                </div>
                <p className="chat-waiting-staff-desc">
                  Yêu cầu đã được chuyển đến nhân viên quầy chi nhánh. Vui lòng giữ kết nối, nhân viên sẽ phản hồi trực tiếp tại đây.
                </p>
                <div className="chat-typing-bubble staff mini">
                  <span className="chat-typing-dot staff" />
                  <span className="chat-typing-dot staff" />
                  <span className="chat-typing-dot staff" />
                  <span className="chat-typing-text">Đang trong hàng chờ hỗ trợ</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="chat-footer">
            <input
              type="text"
              className="chat-input"
              placeholder="Nhập tin nhắn hoặc mã đơn NX..."
              value={inputVal}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />
            <button
              className="chat-send-btn"
              onClick={() => handleSendMessage()}
              disabled={!inputVal.trim()}
              aria-label="Gửi tin nhắn"
            >
              <svg viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>

          {/* Modal kết nối nhân viên thông minh (Smart Handover Gatekeeper) */}
          {showHandoverModal && (
            <div className="chat-modal-overlay">
              <div className="chat-modal-card">
                <div className="chat-modal-header">
                  <h4>Kết nối nhân viên tư vấn</h4>
                  <button
                    type="button"
                    onClick={() => setShowHandoverModal(false)}
                    aria-label="Đóng"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                  </button>
                </div>
                <p className="chat-modal-desc">
                  Chọn đúng vấn đề cần hỗ trợ để được ưu tiên xử lý nhanh và chính xác nhất:
                </p>
                <form onSubmit={handleSubmitHandoverModal}>
                  {/* Phân loại lý do kết nối (Triage Reasons) */}
                  <div className="chat-modal-field">
                    <label className="field-label-required">Vấn đề cần hỗ trợ</label>
                    <div className="chat-reason-chips">
                      {HANDOVER_REASONS.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          className={`chat-reason-chip ${handoverReason === r.id ? "active" : ""} ${r.isUrgent ? "urgent" : ""}`}
                          onClick={() => setHandoverReason(r.id)}
                        >
                          <span>{r.label}</span>
                          {r.isUrgent && <span className="chip-urgent-badge">Ưu tiên</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="chat-modal-field">
                    <label className="field-label-required">Họ và tên của bạn</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Anh Nam, Chị Linh..."
                      value={guestName}
                      onChange={(e) => {
                        setGuestName(e.target.value);
                        setHandoverError("");
                      }}
                      required
                    />
                  </div>
                  <div className="chat-modal-field">
                    <label className="field-label-required">Số điện thoại liên hệ</label>
                    <input
                      type="tel"
                      placeholder="Số điện thoại đặt món (10 chữ số)..."
                      value={guestPhone}
                      onChange={(e) => {
                        setGuestPhone(e.target.value);
                        setHandoverError("");
                      }}
                      required
                    />
                    <span className="field-hint">Dùng để tra cứu đơn hàng và liên hệ hỗ trợ trực tiếp</span>
                  </div>
                  {handoverError && <div className="chat-modal-error">{handoverError}</div>}
                  <div className="chat-modal-actions">
                    <button
                      type="button"
                      className="chat-modal-btn cancel"
                      onClick={() => setShowHandoverModal(false)}
                      disabled={isSubmittingHandover}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="chat-modal-btn submit"
                      disabled={isSubmittingHandover}
                    >
                      {isSubmittingHandover ? "Đang gửi..." : "Xác nhận kết nối"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
