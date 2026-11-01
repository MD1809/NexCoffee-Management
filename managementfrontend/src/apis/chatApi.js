import axiosClient from "./axiosClient";

const chatApi = {
  // === PUBLIC CUSTOMER APIS ===
  initConversation: (payload) => {
    // payload: { sessionId, userId, storeId, customerName, customerPhone }
    return axiosClient.post("/chat/public/init", payload);
  },

  getMessages: (conversationId) => {
    return axiosClient.get(`/chat/public/${conversationId}/messages`);
  },

  sendCustomerMessage: (payload) => {
    // payload: { conversationId, senderType: 'CUSTOMER', content, messageType: 'TEXT' }
    return axiosClient.post("/chat/public/message", payload);
  },

  requestHandover: (conversationId, payload = {}) => {
    // payload: { customerName, customerPhone, storeId }
    return axiosClient.post(`/chat/public/${conversationId}/handover`, payload);
  },

  returnToBot: (conversationId) => {
    return axiosClient.post(`/chat/public/${conversationId}/return-bot`);
  },

  markReadCustomer: (conversationId) => {
    return axiosClient.post(`/chat/public/${conversationId}/read`);
  },

  // === ADMIN / STAFF APIS ===
  getStoreConversations: (params = {}) => {
    // params: { storeId, status }
    return axiosClient.get("/chat/admin/conversations", { params });
  },

  sendStaffMessage: (conversationId, content) => {
    return axiosClient.post(`/chat/admin/${conversationId}/message`, { content });
  },

  assignStaff: (conversationId) => {
    return axiosClient.post(`/chat/admin/${conversationId}/assign`);
  },

  closeConversation: (conversationId) => {
    return axiosClient.post(`/chat/admin/${conversationId}/close`);
  },

  markReadStaff: (conversationId) => {
    return axiosClient.post(`/chat/admin/${conversationId}/read`);
  },

  getQueueStats: (storeId = null) => {
    return axiosClient.get("/chat/admin/stats", {
      params: storeId ? { storeId } : {},
    });
  },

  getCustomerContext: (conversationId) => {
    return axiosClient.get(`/chat/admin/conversations/${conversationId}/context`);
  },

  sendOrderCard: (conversationId, payload) => {
    // payload: { orderId, orderCode }
    return axiosClient.post(`/chat/admin/${conversationId}/send-order-card`, payload);
  },
};

export default chatApi;
