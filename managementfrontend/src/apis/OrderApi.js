import axiosClient from "./axiosClient";

const orderApi = {
  // Lấy danh sách đơn hàng
  getAll: (date) => {
    let url = "/orders";
    if (date) {
      url += `?date=${date}`;
    }
    return axiosClient.get(url);
  },

  getToday: () => {
    return axiosClient.get("/orders/today");
  },

  // Lấy chi tiết đơn hàng
  getById: (id) => {
    return axiosClient.get(`/orders/${id}`);
  },

  updateOrderStatus: (id, payload) => {
    return axiosClient.patch(`/orders/${id}/status`, payload);
  },
};

export default orderApi;
