import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Client } from "@stomp/stompjs";
import { toast } from "react-toastify";
import chatApi from "../../../apis/chatApi";
import "./supportChat.css";

// Các mẫu tin nhắn phản hồi nhanh dành cho nhân viên
const CANNED_RESPONSES = [
  {
    label: "Chào hỏi",
    text: "Dạ em chào anh/chị ạ! Em có thể hỗ trợ thông tin gì cho mình hôm nay ạ?",
  },
  {
    label: "Hỏi mã đơn",
    text: "Anh/chị vui lòng cho em xin Mã đơn hàng để em kiểm tra chi tiết giúp mình ngay ạ!",
  },
  {
    label: "Đang pha chế",
    text: "Dạ đơn hàng của mình đang được Barista ưu tiên pha chế, dự kiến hoàn thành trong ít phút nữa ạ.",
  },
  {
    label: "Hẹn giờ giao",
    text: "Dạ Shipper đang trên đường giao hàng đến địa chỉ của mình, dự kiến khoảng 15-20 phút nữa tới nơi ạ.",
  },
  {
    label: "Xin lỗi / Xử lý sự cố",
    text: "Dạ NexCoffee rất xin lỗi vì sự bất tiện này ạ! Em sẽ báo ngay với quản lý ca trực để xử lý thỏa đáng cho mình ngay ạ.",
  },
];

export default function SupportChat() {
  const [activeTab, setActiveTab] = useState("WAITING_STAFF");
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [queueStats, setQueueStats] = useState({ waiting: 0, active: 0 });

  // Thông tin hồ sơ khách hàng (Cột 3)
  const [customerContext, setCustomerContext] = useState(null);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [isContextCollapsed, setIsContextCollapsed] = useState(false);
  const [sendingOrderCardId, setSendingOrderCardId] = useState(null);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Trạng thái khách hàng đang soạn tin nhắn
  const [isCustomerTyping, setIsCustomerTyping] = useState(false);
  const customerTypingTimeoutRef = useRef(null);
  const staffTypingDebounceRef = useRef(null);

  const messagesEndRef = useRef(null);
  const stompClientRef = useRef(null);
  const inputRef = useRef(null);

  // Khóa cuộn trang cha và chuyển layout sang tràn viền toàn màn hình khi vào trang SupportChat
  useEffect(() => {
    document.body.classList.add("support-chat-page-active");
    return () => {
      document.body.classList.remove("support-chat-page-active");
    };
  }, []);

  // Lấy thống kê số lượng hội thoại đang chờ
  const fetchStats = useCallback(async () => {
    try {
      const res = await chatApi.getQueueStats();
      if (res.data) {
        setQueueStats({
          waiting: res.data.waitingCount || res.data.waiting || 0,
          active: res.data.withStaffCount || res.data.active || 0,
        });
      }
    } catch (err) {
      console.error("Lỗi lấy stats chat:", err);
    }
  }, []);

  // Lấy danh sách cuộc trò chuyện theo tab
  const fetchConversations = useCallback(async (status) => {
    try {
      setIsLoadingList(true);
      const params = {};
      if (status !== "ALL") {
        params.status = status;
      }
      const res = await chatApi.getStoreConversations(params);
      if (res.data) {
        setConversations(res.data);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách hội thoại:", err);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  // Tải tin nhắn của hội thoại đang chọn
  const loadMessages = useCallback(async (convId) => {
    try {
      setIsLoadingMessages(true);
      const res = await chatApi.getMessages(convId);
      if (res.data) {
        setMessages(res.data);
        chatApi.markReadStaff(convId).catch(() => {});
      }
    } catch (err) {
      console.error("Lỗi tải tin nhắn:", err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // Tải hồ sơ thông tin khách hàng (Cột 3)
  const loadCustomerContext = useCallback(async (convId) => {
    if (!convId) return;
    try {
      setIsLoadingContext(true);
      const res = await chatApi.getCustomerContext(convId);
      if (res.data) {
        setCustomerContext(res.data);
      } else {
        setCustomerContext(null);
      }
    } catch (err) {
      console.error("Lỗi tải thông tin khách hàng:", err);
      setCustomerContext(null);
    } finally {
      setIsLoadingContext(false);
    }
  }, []);

  // Khởi tạo danh sách & stats
  useEffect(() => {
    fetchStats();
    fetchConversations(activeTab);
  }, [activeTab, fetchStats, fetchConversations]);

  // Thiết lập WebSocket STOMP kết nối hệ thống
  useEffect(() => {
    const wsHost = window.location.hostname || "localhost";
    const brokerURL =
      (window.location.protocol === "https:" ? "wss://" : "ws://") +
      wsHost +
      ":8080/ws-chat-raw";

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
      // Đăng ký nhận thông báo hàng đợi chung khi có khách yêu cầu hỗ trợ
      stompClient.subscribe("/topic/admin/queue", (frame) => {
        try {
          const payload = JSON.parse(frame.body);
          if (payload.status === "WAITING_STAFF") {
            toast.info(`Có khách hàng cần hỗ trợ: ${payload.customerName || "Khách hàng"}`);
          }
          fetchStats();
          fetchConversations(activeTab);
        } catch (e) {
          console.error("Lỗi frame queue:", e);
        }
      });
    };

    stompClient.activate();
    stompClientRef.current = stompClient;

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [activeTab, fetchStats, fetchConversations]);

  // Đăng ký nhận tin nhắn realtime và typing status cho cuộc trò chuyện đang active
  useEffect(() => {
    setIsCustomerTyping(false);
    if (!activeConv?.id || !stompClientRef.current) return;

    // 1. Nhận tin nhắn mới hoặc cập nhật trạng thái hội thoại
    const subMsg = stompClientRef.current.subscribe(
      `/topic/conversation/${activeConv.id}`,
      (frame) => {
        try {
          const payload = JSON.parse(frame.body);

          // Nếu đây là payload cập nhật trạng thái hội thoại (ChatConversationResponse)
          if (payload.status && !payload.senderType) {
            setActiveConv((prev) => (prev && prev.id === payload.id ? { ...prev, ...payload } : prev));
            fetchStats();
            fetchConversations(activeTab);
            return;
          }

          const newMsg = payload;
          setMessages((prev) => {
            if (newMsg.id && prev.some((m) => String(m.id) === String(newMsg.id))) return prev;
            return [...prev, newMsg];
          });
          // Nếu khách hàng gửi tin nhắn thành công, ẩn ngay typing indicator
          if (newMsg.senderType === "CUSTOMER") {
            setIsCustomerTyping(false);
          }
        } catch (e) {
          console.error("Lỗi socket msg:", e);
        }
      }
    );

    // 2. Nhận tín hiệu khách hàng đang soạn tin
    const subTyping = stompClientRef.current.subscribe(
      `/topic/conversation/${activeConv.id}/typing`,
      (frame) => {
        try {
          const payload = JSON.parse(frame.body);
          if (payload.senderType === "CUSTOMER") {
            const typing = Boolean(payload.isTyping);
            setIsCustomerTyping(typing);
            if (typing) {
              if (customerTypingTimeoutRef.current) clearTimeout(customerTypingTimeoutRef.current);
              customerTypingTimeoutRef.current = setTimeout(() => {
                setIsCustomerTyping(false);
              }, 4000);
            }
          }
        } catch (e) {
          console.error("Lỗi socket typing:", e);
        }
      }
    );

    return () => {
      try {
        subMsg.unsubscribe();
      } catch {}
      try {
        subTyping.unsubscribe();
      } catch {}
      if (customerTypingTimeoutRef.current) clearTimeout(customerTypingTimeoutRef.current);
      if (staffTypingDebounceRef.current) clearTimeout(staffTypingDebounceRef.current);
    };
  }, [activeConv?.id]);

  // Tự động cuộn xuống khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoadingMessages]);

  // Chọn hội thoại từ danh sách
  const handleSelectConv = (conv) => {
    setActiveConv(conv);
    loadMessages(conv.id);
    loadCustomerContext(conv.id);
  };

  // Tiếp nhận cuộc trò chuyện
  const handleAssignStaff = async () => {
    if (!activeConv) return;
    try {
      const res = await chatApi.assignStaff(activeConv.id);
      if (res.data) {
        setActiveConv(res.data);
        toast.success("Đã tiếp nhận hỗ trợ khách hàng!");
        fetchStats();
        fetchConversations(activeTab);
      }
    } catch (err) {
      toast.error("Không thể tiếp nhận hội thoại: " + (err.response?.data?.message || err.message));
    }
  };

  // Kết thúc cuộc trò chuyện
  const handleCloseConv = async () => {
    if (!activeConv) return;
    try {
      const res = await chatApi.closeConversation(activeConv.id);
      if (res.data) {
        setActiveConv(res.data);
        toast.info("Đã kết thúc phiên hỗ trợ.");
        fetchStats();
        fetchConversations(activeTab);
      }
    } catch (err) {
      toast.error("Lỗi khi kết thúc: " + (err.response?.data?.message || err.message));
    }
  };

  // Xử lý khi nhân viên gõ bàn phím -> phát sự kiện đang gõ cho khách hàng
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputVal(val);

    if (activeConv?.id && activeConv.status === "WITH_STAFF" && stompClientRef.current?.connected) {
      try {
        stompClientRef.current.publish({
          destination: "/app/chat.typing",
          body: JSON.stringify({
            conversationId: activeConv.id,
            senderType: "STAFF",
            isTyping: true,
          }),
        });

        if (staffTypingDebounceRef.current) clearTimeout(staffTypingDebounceRef.current);
        staffTypingDebounceRef.current = setTimeout(() => {
          if (stompClientRef.current?.connected && activeConv?.id) {
            stompClientRef.current.publish({
              destination: "/app/chat.typing",
              body: JSON.stringify({
                conversationId: activeConv.id,
                senderType: "STAFF",
                isTyping: false,
              }),
            });
          }
        }, 3000);
      } catch (err) {}
    }
  };

  // Gửi tin nhắn từ phía nhân viên
  const handleSendStaffMsg = async () => {
    const text = inputVal.trim();
    if (!text || !activeConv) return;

    setInputVal("");

    // Dừng ngay trạng thái typing của nhân viên
    if (staffTypingDebounceRef.current) clearTimeout(staffTypingDebounceRef.current);
    if (stompClientRef.current?.connected && activeConv?.id) {
      try {
        stompClientRef.current.publish({
          destination: "/app/chat.typing",
          body: JSON.stringify({
            conversationId: activeConv.id,
            senderType: "STAFF",
            isTyping: false,
          }),
        });
      } catch (e) {}
    }

    try {
      const res = await chatApi.sendStaffMessage(activeConv.id, text);
      if (res.data) {
        setMessages((prev) => {
          if (res.data?.id && prev.some((m) => String(m.id) === String(res.data.id))) return prev;
          return [...prev, res.data];
        });
      }
    } catch (err) {
      toast.error("Không thể gửi tin nhắn: " + (err.response?.data?.message || err.message));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendStaffMsg();
    }
  };

  // Thêm nhanh câu phản hồi mẫu vào ô nhập liệu
  const handleApplyCanned = (text) => {
    setInputVal(text);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Sao chép số điện thoại khách hàng
  const handleCopyPhone = (phone) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    toast.success("Đã sao chép số điện thoại!");
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  // Gửi thẻ thông tin đơn hàng trực tiếp vào cuộc trò chuyện
  const handleSendOrderCard = async (order) => {
    if (!activeConv || !order) return;
    if (activeConv.status !== "WITH_STAFF") {
      toast.warning("Vui lòng bấm 'Tiếp nhận hỗ trợ' trước khi gửi thẻ đơn hàng cho khách!");
      return;
    }
    try {
      setSendingOrderCardId(order.orderId);
      const res = await chatApi.sendOrderCard(activeConv.id, {
        orderId: order.orderId,
        orderCode: order.orderCode,
      });
      if (res.data) {
        setMessages((prev) => {
          if (res.data?.id && prev.some((m) => String(m.id) === String(res.data.id))) return prev;
          return [...prev, res.data];
        });
        toast.success(`Đã gửi thông tin đơn #${order.orderCode} vào chat!`);
      }
    } catch (err) {
      toast.error("Không thể gửi thẻ đơn hàng: " + (err.response?.data?.message || err.message));
    } finally {
      setSendingOrderCardId(null);
    }
  };

  // Lọc danh sách hội thoại theo từ khóa tìm kiếm
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => {
      const name = (c.customerName || "").toLowerCase();
      const phone = (c.customerPhone || "").toLowerCase();
      const session = (c.sessionId || "").toLowerCase();
      return name.includes(q) || phone.includes(q) || session.includes(q);
    });
  }, [conversations, searchQuery]);

  // Safe parse JSON cho Order Card
  const parseJsonSafe = (jsonStr) => {
    if (!jsonStr) return null;
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      return null;
    }
  };

  return (
    <div className={`support-chat-container ${isContextCollapsed ? "context-collapsed" : ""}`}>
      {/* =========================================================================
          CỘT 1: DANH SÁCH CUỘC TRÒ CHUYỆN (VỚI BADGE THÀNH VIÊN / VÃNG LAI)
      ========================================================================= */}
      <div className="support-chat-sidebar">
        <div className="support-chat-sidebar-header">
          <div className="support-sidebar-title-row">
            <h2>Hỗ trợ trực tuyến</h2>
            <span className="support-active-indicator" title="Máy chủ STOMP sẵn sàng" />
          </div>

          {/* Ô tìm kiếm khách hàng */}
          <div className="support-search-wrapper">
            <svg viewBox="0 0 24 24" className="support-search-icon" aria-hidden="true">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
            <input
              type="text"
              placeholder="Tìm tên, SĐT, mã phiên..."
              className="support-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="support-search-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Xóa tìm kiếm"
              >
                ×
              </button>
            )}
          </div>

          {/* Tabs bộ lọc */}
          <div className="support-chat-tabs">
            <button
              className={`support-tab-btn ${activeTab === "WAITING_STAFF" ? "active" : ""}`}
              onClick={() => setActiveTab("WAITING_STAFF")}
            >
              Chờ hỗ trợ
              {queueStats.waiting > 0 && (
                <span className="support-tab-badge">{queueStats.waiting}</span>
              )}
            </button>
            <button
              className={`support-tab-btn ${activeTab === "WITH_STAFF" ? "active" : ""}`}
              onClick={() => setActiveTab("WITH_STAFF")}
            >
              Đang chat
              {queueStats.active > 0 && (
                <span className="support-tab-badge active-tab-badge">{queueStats.active}</span>
              )}
            </button>
            <button
              className={`support-tab-btn ${activeTab === "ALL" ? "active" : ""}`}
              onClick={() => setActiveTab("ALL")}
            >
              Tất cả
            </button>
          </div>
        </div>

        {/* Danh sách các cuộc trò chuyện */}
        <div className="support-conversation-list">
          {isLoadingList ? (
            <>
              <div className="support-skeleton-item" />
              <div className="support-skeleton-item" />
              <div className="support-skeleton-item" />
            </>
          ) : filteredConversations.length === 0 ? (
            <div className="support-empty-list">
              {searchQuery ? "Không tìm thấy khách hàng phù hợp." : "Không có cuộc trò chuyện nào trong mục này."}
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isSelected = activeConv?.id === c.id;
              const isMember = Boolean(c.userId);
              const displayName =
                c.customerName ||
                `Khách vãng lai #${c.sessionId ? c.sessionId.slice(-4) : "nex"}`;

              return (
                <div
                  key={c.id}
                  className={`support-conv-item ${isSelected ? "active" : ""}`}
                  onClick={() => handleSelectConv(c)}
                >
                  <div className="support-conv-header">
                    <div className="support-conv-name-box">
                      <span className="support-conv-user">{displayName}</span>
                      <span
                        className={`support-member-pill ${
                          isMember ? "member" : "guest"
                        }`}
                      >
                        {isMember ? "Thành viên" : "Vãng lai"}
                      </span>
                    </div>

                    <span className="support-conv-time">
                      {c.updatedAt || c.lastMessageAt
                        ? new Date(c.updatedAt || c.lastMessageAt).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </div>

                  {/* Hiển thị số điện thoại nếu có */}
                  {c.customerPhone && (
                    <div className="support-conv-phone">
                      <svg viewBox="0 0 24 24" className="icon-tiny" aria-hidden="true">
                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                      </svg>
                      <span>{c.customerPhone}</span>
                    </div>
                  )}

                  {/* Hiển thị lý do kết nối nếu có */}
                  {c.handoverReason && (
                    <div className="support-conv-reason-wrap">
                      <span
                        className={`support-reason-pill ${
                          c.handoverReason.includes("Sự cố")
                            ? "urgent"
                            : c.handoverReason.includes("Khiếu nại")
                            ? "complaint"
                            : ""
                        }`}
                      >
                        {c.handoverReason}
                      </span>
                    </div>
                  )}

                  <div className="support-conv-preview">
                    {c.lastMessageSnippet || c.lastMessageContent || "Chưa có tin nhắn..."}
                  </div>

                  <div className="support-conv-footer">
                    <span className={`support-badge-status ${c.status}`}>
                      {c.status === "WAITING_STAFF"
                        ? "Chờ tiếp nhận"
                        : c.status === "WITH_STAFF"
                        ? "Đang phụ trách"
                        : c.status === "BOT"
                        ? "AI Bot"
                        : "Đã đóng"}
                    </span>
                    {(c.unreadCountStaff || c.unreadStaffCount) > 0 && (
                      <span className="support-tab-badge">
                        {c.unreadCountStaff || c.unreadStaffCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* =========================================================================
          CỘT 2: KHUNG TRÒ CHUYỆN CHÍNH (VỚI CANNED RESPONSES VÀ ORDER CARDS)
      ========================================================================= */}
      <div className="support-chat-main">
        {!activeConv ? (
          <div className="support-empty-state">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
            </svg>
            <p>Chọn một cuộc trò chuyện ở danh sách bên trái để bắt đầu hỗ trợ khách hàng</p>
          </div>
        ) : (
          <>
            {/* Header khung chat */}
            <div className="support-chat-header">
              <div className="support-customer-meta">
                <div className="support-customer-title-row">
                  <h3>
                    {activeConv.customerName ||
                      `Khách vãng lai #${activeConv.sessionId ? activeConv.sessionId.slice(-4) : "nex"}`}
                  </h3>
                  <span
                    className={`support-member-pill ${
                      activeConv.userId ? "member" : "guest"
                    }`}
                  >
                    {activeConv.userId ? "Thành viên NexCoffee" : "Khách vãng lai"}
                  </span>
                </div>

                <div className="support-customer-details">
                  {activeConv.customerPhone && (
                    <span className="meta-detail-item">
                      <svg viewBox="0 0 24 24" className="icon-tiny" aria-hidden="true">
                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                      </svg>
                      {activeConv.customerPhone}
                    </span>
                  )}
                  {activeConv.storeName && (
                    <span className="meta-detail-item">Chi nhánh: {activeConv.storeName}</span>
                  )}
                  {activeConv.handoverReason && (
                    <span
                      className={`meta-detail-item support-header-reason ${
                        activeConv.handoverReason.includes("Sự cố")
                          ? "urgent"
                          : activeConv.handoverReason.includes("Khiếu nại")
                          ? "complaint"
                          : ""
                      }`}
                    >
                      Lý do: {activeConv.handoverReason}
                    </span>
                  )}
                  <span className="meta-detail-item session-tag">
                    Phiên: #{activeConv.sessionId?.slice(-6) || "nex"}
                  </span>
                </div>
              </div>

              {/* Các nút hành động phía trên header */}
              <div className="support-actions">
                {(activeConv.status === "WAITING_STAFF" || activeConv.status === "BOT") && (
                  <button className="btn-accept-chat" onClick={handleAssignStaff}>
                    Tiếp nhận hỗ trợ
                  </button>
                )}

                {activeConv.status === "WITH_STAFF" && (
                  <button className="btn-close-chat" onClick={handleCloseConv}>
                    Kết thúc phiên
                  </button>
                )}

                {/* Nút bật/tắt hồ sơ khách hàng cột 3 */}
                <button
                  className={`btn-toggle-context ${!isContextCollapsed ? "active" : ""}`}
                  onClick={() => setIsContextCollapsed(!isContextCollapsed)}
                  title={isContextCollapsed ? "Mở hồ sơ khách hàng" : "Thu gọn hồ sơ khách hàng"}
                  aria-label="Chuyển đổi hồ sơ khách hàng"
                >
                  <svg viewBox="0 0 24 24" className="icon-small" aria-hidden="true">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                  <span>Hồ sơ khách</span>
                </button>
              </div>
            </div>

            {/* Dòng tin nhắn stream */}
            <div className="support-messages-stream">
              {isLoadingMessages ? (
                <div className="support-loading-text">Đang tải nội dung hội thoại...</div>
              ) : (
                messages.map((m, idx) => {
                  const isStaff = m.senderType === "STAFF";
                  const isCustomer = m.senderType === "CUSTOMER";
                  const isSystem = m.senderType === "SYSTEM" || m.messageType === "SYSTEM";
                  const isOrderCard = m.messageType === "ORDER_CARD";

                  if (isSystem) {
                    let displayContent = m.content;
                    if (displayContent === "Bạn đã chuyển về trò chuyện cùng trợ lý AI.") {
                      displayContent = "Khách hàng đã chuyển về trò chuyện cùng trợ lý AI.";
                    }
                    return (
                      <div key={m.id || idx} className="support-msg-row system">
                        <div className="support-msg-bubble">{displayContent}</div>
                      </div>
                    );
                  }

                  const metadata = m.metadataJson ? parseJsonSafe(m.metadataJson) : null;
                  const itemKey = m.id ? `staff-msg-${m.id}` : `staff-temp-${idx}-${m.createdAt || ""}`;

                  return (
                    <div
                      key={itemKey}
                      className={`support-msg-row ${
                        isStaff ? "staff" : isCustomer ? "customer" : "bot"
                      }`}
                    >
                      <span className="support-msg-author">
                        {isCustomer
                          ? activeConv.customerName || "Khách hàng"
                          : isStaff
                          ? `Nhân viên (${m.senderName || "Tư vấn"})`
                          : "Hệ thống (NexCoffee AI)"}
                      </span>

                      <div className="support-msg-bubble" style={{ whiteSpace: "pre-line" }}>
                        {m.content ? m.content.replace(/\*\*/g, "") : ""}

                        {/* Thẻ đơn hàng trực quan nếu tin nhắn là ORDER_CARD */}
                        {isOrderCard && metadata && (
                          <div className="support-order-card-rendered">
                            <div className="order-card-header">
                              <span className="order-card-code">Đơn hàng #{metadata.code}</span>
                              <span className={`order-status-tag ${metadata.status || ""}`}>
                                {metadata.statusText || metadata.status}
                              </span>
                            </div>
                            <div className="order-card-total">
                              Tổng tiền: <strong>{metadata.totalFormatted}</strong>
                            </div>
                          </div>
                        )}

                        {/* Danh sách món gợi ý nếu tin nhắn là PRODUCT_CARD */}
                        {((m.messageType === "PRODUCT_CARD") || (metadata && Array.isArray(metadata) && metadata.length > 0)) && Array.isArray(metadata) && metadata.length > 0 && (
                          <div className="support-product-cards-preview">
                            {metadata.map((item, pIdx) => (
                              <div key={item.id ? `p-${item.id}` : `p-${pIdx}`} className="support-product-preview-chip">
                                <span className="support-product-preview-name">{item.name}</span>
                                {item.price && (
                                  <span className="support-product-preview-price">
                                    {Math.round(item.price).toLocaleString("vi-VN")}đ
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <span className="support-msg-time">
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

              {/* Trạng thái khách hàng đang soạn tin nhắn */}
              {isCustomerTyping && (
                <div className="support-msg-row customer typing" aria-live="polite">
                  <span className="support-msg-author">
                    {activeConv.customerName || "Khách hàng"} đang soạn tin nhắn...
                  </span>
                  <div className="support-typing-indicator">
                    <span className="support-typing-dot" />
                    <span className="support-typing-dot" />
                    <span className="support-typing-dot" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Thanh câu trả lời mẫu nhanh (Canned responses) */}
            {activeConv.status === "WITH_STAFF" && (
              <div className="support-canned-bar" aria-label="Câu trả lời mẫu">
                <span className="canned-label">Mẫu nhanh:</span>
                <div className="canned-chips-container">
                  {CANNED_RESPONSES.map((item, idx) => (
                    <button
                      key={idx}
                      className="canned-chip"
                      onClick={() => handleApplyCanned(item.text)}
                      title={item.text}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Khung nhập tin nhắn */}
            <div className="support-chat-input-bar">
              <input
                ref={inputRef}
                type="text"
                className="support-input-field"
                placeholder={
                  activeConv.status === "CLOSED"
                    ? "Phiên trò chuyện này đã kết thúc."
                    : activeConv.status === "WAITING_STAFF"
                    ? "Bấm 'Tiếp nhận hỗ trợ' phía trên để bắt đầu tư vấn..."
                    : activeConv.status === "BOT"
                    ? "Khách đang trò chuyện cùng AI. Bấm 'Tiếp nhận hỗ trợ' để tư vấn..."
                    : "Nhập tin nhắn tư vấn gửi khách hàng..."
                }
                value={inputVal}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={activeConv.status !== "WITH_STAFF"}
              />
              <button
                className="support-send-btn"
                onClick={handleSendStaffMsg}
                disabled={
                  !inputVal.trim() ||
                  activeConv.status !== "WITH_STAFF"
                }
              >
                Gửi
              </button>
            </div>
          </>
        )}
      </div>

      {/* =========================================================================
          CỘT 3: HỒ SƠ VÀ BỐI CẢNH KHÁCH HÀNG (CUSTOMER CONTEXT PANEL)
      ========================================================================= */}
      {activeConv && !isContextCollapsed && (
        <div className="support-context-panel">
          <div className="context-panel-header">
            <h4>Thông tin khách hàng</h4>
            <button
              className="context-close-btn"
              onClick={() => setIsContextCollapsed(true)}
              aria-label="Thu gọn bảng thông tin"
            >
              ×
            </button>
          </div>

          <div className="context-panel-body">
            {isLoadingContext ? (
              <div className="context-skeleton-wrap">
                <div className="support-skeleton-item" style={{ height: "100px" }} />
                <div className="support-skeleton-item" style={{ height: "70px" }} />
                <div className="support-skeleton-item" style={{ height: "120px" }} />
              </div>
            ) : customerContext ? (
              <>
                {/* 1. Profile Avatar & Card */}
                <div className="context-profile-card">
                  <div className="context-avatar-circle">
                    {(customerContext.customerName || "K").charAt(0).toUpperCase()}
                  </div>
                  <div className="context-profile-meta">
                    <h5 className="context-customer-name">
                      {customerContext.customerName || "Khách hàng"}
                    </h5>
                    <span
                      className={`support-member-pill ${
                        customerContext.isMember ? "member" : "guest"
                      }`}
                    >
                      {customerContext.isMember ? "Hội viên NexCoffee" : "Khách vãng lai"}
                    </span>
                  </div>
                </div>

                {/* 2. Liên hệ chi tiết */}
                <div className="context-section">
                  <div className="context-section-title">Thông tin liên hệ</div>

                  <div className="context-info-row">
                    <span className="info-label">Số điện thoại:</span>
                    {customerContext.phone ? (
                      <div className="phone-copy-box">
                        <span className="info-value phone">{customerContext.phone}</span>
                        <button
                          className="copy-btn"
                          onClick={() => handleCopyPhone(customerContext.phone)}
                          title="Sao chép SĐT"
                          aria-label="Sao chép số điện thoại"
                        >
                          {copiedPhone ? (
                            <span className="copied-text">Đã chép</span>
                          ) : (
                            <svg viewBox="0 0 24 24" className="icon-tiny" aria-hidden="true">
                              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="info-value muted">Chưa cung cấp</span>
                    )}
                  </div>

                  {customerContext.email && (
                    <div className="context-info-row">
                      <span className="info-label">Email:</span>
                      <span className="info-value">{customerContext.email}</span>
                    </div>
                  )}

                  {customerContext.memberSince && (
                    <div className="context-info-row">
                      <span className="info-label">Đăng ký từ:</span>
                      <span className="info-value">
                        {new Date(customerContext.memberSince).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  )}

                  {(customerContext.handoverReason || activeConv.handoverReason) && (
                    <div className="context-info-row">
                      <span className="info-label">Lý do hỗ trợ:</span>
                      <span className="info-value highlight-reason">
                        {customerContext.handoverReason || activeConv.handoverReason}
                      </span>
                    </div>
                  )}
                </div>

                {/* 3. Thống kê chi tiêu (KPIs) */}
                <div className="context-kpi-grid">
                  <div className="context-kpi-card">
                    <span className="kpi-label">Tổng chi tiêu</span>
                    <strong className="kpi-value highlight">
                      {(customerContext.totalSpent || 0).toLocaleString("vi-VN")} đ
                    </strong>
                  </div>
                  <div className="context-kpi-card">
                    <span className="kpi-label">Đơn hàng</span>
                    <strong className="kpi-value">{customerContext.orderCount || 0} đơn</strong>
                  </div>
                </div>

                {/* 4. Danh sách đơn hàng gần đây */}
                <div className="context-section">
                  <div className="context-orders-header">
                    <span className="context-section-title">5 đơn hàng gần nhất</span>
                    <span className="orders-count-tag">
                      {customerContext.recentOrders?.length || 0} đơn
                    </span>
                  </div>

                  {customerContext.recentOrders && customerContext.recentOrders.length > 0 ? (
                    <div className="context-orders-list">
                      {customerContext.recentOrders.map((ord) => (
                        <div key={ord.orderId} className="context-order-item">
                          <div className="order-item-top">
                            <span className="order-item-code">#{ord.orderCode}</span>
                            <span className={`order-status-tag ${ord.status}`}>
                              {ord.statusText}
                            </span>
                          </div>

                          <div className="order-item-summary">{ord.itemsSummary}</div>

                          <div className="order-item-bottom">
                            <span className="order-item-price">{ord.totalFormatted}</span>
                            <button
                              className="btn-send-order-card"
                              disabled={
                                sendingOrderCardId === ord.orderId ||
                                activeConv.status !== "WITH_STAFF"
                              }
                              onClick={() => handleSendOrderCard(ord)}
                              title={
                                activeConv.status !== "WITH_STAFF"
                                  ? "Cần bấm 'Tiếp nhận hỗ trợ' trước khi gửi thẻ đơn hàng"
                                  : "Gửi thẻ tóm tắt đơn này vào chat"
                              }
                            >
                              {sendingOrderCardId === ord.orderId ? "Đang gửi..." : "Gửi thẻ"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="context-empty-orders">
                      <p>Khách hàng chưa có lịch sử đơn hàng nào trên hệ thống.</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="context-empty-orders">
                <p>Chưa có dữ liệu hồ sơ cho cuộc trò chuyện này.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
