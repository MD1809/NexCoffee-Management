import axiosClient from "./axiosClient";

const posApi = {
  // Lấy danh sách sản phẩm
  getProducts: () => {
    return axiosClient.get("/pos/products");
  },

  // Lấy danh sách danh mục
  getCategories: () => {
    return axiosClient.get("/pos/categories");
  },

  // Thanh toán
  checkout: (orderData) => {
    return axiosClient.post("/pos/checkout", orderData);
  },

  // Lấy danh sách đơn cần pha chế cho Barista
  getBaristaOrders: (storeId) => {
    return axiosClient.get("/pos/barista/orders", {
      params: storeId ? { storeId } : {},
    });
  },

  // Hoàn thành pha chế đơn hàng
  completeBaristaOrder: (orderId, data) => {
    return axiosClient.patch(`/pos/barista/orders/${orderId}/complete`, data);
  },
};

export default posApi;