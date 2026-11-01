import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { Client } from "@stomp/stompjs";
import orderApi from "../apis/OrderApi";
import posApi from "../apis/posApi";
import chatApi from "../apis/chatApi";
import { getCurrentUser, AUTH_EVENTS } from "../utils/authStorage";

const AdminNotificationContext = createContext({
  pendingOrdersCount: 0,
  baristaOrdersCount: 0,
  chatWaitingCount: 0,
  totalAlertsCount: 0,
  refreshNotifications: () => {},
});

export const useAdminNotifications = () => useContext(AdminNotificationContext);

export function AdminNotificationProvider({ children }) {
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [baristaOrdersCount, setBaristaOrdersCount] = useState(0);
  const [chatWaitingCount, setChatWaitingCount] = useState(0);
  const stompClientRef = useRef(null);

  const currentUser = getCurrentUser();
  const userRole = currentUser?.role;
  const currentStoreId = currentUser?.storeId || null;

  // 1. Tải số lượng đơn hàng mới (Chờ xác nhận / Pending)
  const fetchPendingOrders = useCallback(async () => {
    if (!["ADMIN", "SUPER_ADMIN", "STAFF"].includes(userRole)) return;
    try {
      const res = await orderApi.getToday();
      if (res && Array.isArray(res.data)) {
        const pendingCount = res.data.filter(
          (o) => String(o.status || "").toLowerCase() === "pending"
        ).length;
        setPendingOrdersCount(pendingCount);
      }
    } catch (err) {
      // Bỏ qua lỗi kết nối tạm thời
    }
  }, [userRole]);

  // 2. Tải số lượng đơn đang chờ pha chế (Barista KDS)
  const fetchBaristaOrders = useCallback(async () => {
    if (!["ADMIN", "STAFF"].includes(userRole)) {
      setBaristaOrdersCount(0);
      return;
    }
    try {
      const res = await posApi.getBaristaOrders(currentStoreId);
      if (res && Array.isArray(res.data)) {
        setBaristaOrdersCount(res.data.length);
      }
    } catch (err) {
      // Bỏ qua lỗi
    }
  }, [userRole, currentStoreId]);

  // 3. Tải số lượng yêu cầu chat đang chờ nhân viên (WAITING_STAFF)
  const fetchChatQueue = useCallback(async () => {
    if (!["ADMIN", "SUPER_ADMIN", "STAFF"].includes(userRole)) return;
    try {
      const res = await chatApi.getQueueStats(currentStoreId);
      if (res && res.data) {
        const count = Number(res.data.waitingCount ?? res.data.waiting ?? 0);
        setChatWaitingCount(count);
      }
    } catch (err) {
      // Bỏ qua lỗi
    }
  }, [userRole, currentStoreId]);

  // Tổng hợp refresh tất cả
  const refreshNotifications = useCallback(() => {
    fetchPendingOrders();
    fetchBaristaOrders();
    fetchChatQueue();
  }, [fetchPendingOrders, fetchBaristaOrders, fetchChatQueue]);

  // Polling tự động mỗi 15 giây & khi focus lại tab trình duyệt
  useEffect(() => {
    refreshNotifications();

    const interval = setInterval(() => {
      refreshNotifications();
    }, 15000);

    const handleFocus = () => {
      refreshNotifications();
    };

    const handleCustomRefresh = () => {
      refreshNotifications();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("admin-notifications:refresh", handleCustomRefresh);
    window.addEventListener(AUTH_EVENTS.AUTH_CHANGED, handleCustomRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("admin-notifications:refresh", handleCustomRefresh);
      window.removeEventListener(AUTH_EVENTS.AUTH_CHANGED, handleCustomRefresh);
    };
  }, [refreshNotifications]);

  // Lắng nghe WebSocket STOMP để cập nhật realtime cho Chat Queue
  useEffect(() => {
    if (!["ADMIN", "SUPER_ADMIN", "STAFF"].includes(userRole)) return;

    const wsHost = window.location.hostname || "localhost";
    const brokerURL =
      (window.location.protocol === "https:" ? "wss://" : "ws://") +
      wsHost +
      ":8080/ws-chat-raw";

    const client = new Client({
      brokerURL,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onWebSocketError: () => {},
      onStompError: () => {},
      debug: () => {},
    });

    client.onConnect = () => {
      client.subscribe("/topic/admin/queue", (frame) => {
        try {
          const payload = JSON.parse(frame.body);
          if (payload && payload.waitingCount !== undefined) {
            setChatWaitingCount(Number(payload.waitingCount) || 0);
          } else {
            // Khi có sự kiện queue mới, gọi fetchChatQueue để lấy số liệu chính xác
            fetchChatQueue();
          }
        } catch (e) {
          fetchChatQueue();
        }
      });
    };

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [userRole, fetchChatQueue]);

  const totalAlertsCount = pendingOrdersCount + baristaOrdersCount + chatWaitingCount;

  return (
    <AdminNotificationContext.Provider
      value={{
        pendingOrdersCount,
        baristaOrdersCount,
        chatWaitingCount,
        totalAlertsCount,
        refreshNotifications,
      }}
    >
      {children}
    </AdminNotificationContext.Provider>
  );
}
