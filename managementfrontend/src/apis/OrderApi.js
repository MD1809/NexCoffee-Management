import axiosClient from "./axiosClient";

const orderApi = {
  // Lấy danh sách category
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

  // Cập nhập trạng thánh đơn hàng
  
  updateOrderStatus: (id, status) => {
  return axiosClient.patch(`/orders/${id}/status?status=${status}`);
}
};

export default orderApi;