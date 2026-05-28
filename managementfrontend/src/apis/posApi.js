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
  }
};

export default posApi;