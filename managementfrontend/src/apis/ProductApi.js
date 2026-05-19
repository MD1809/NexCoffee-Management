import axiosClient from "../apis/axiosClient";

const productService = {
  // Lấy danh sách sản phẩm
  getAll: () => {
    return axiosClient.get("/products");
  },

  // Lấy chi tiết sản phẩm
  getById: (id) => {
    return axiosClient.get(`/products/${id}`);
  },

  // Tạo sản phẩm mới
  create: (data) => {
    return axiosClient.post("/products", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Cập nhât sản phẩm
  update: (id, data) => {
    return axiosClient.put(`/products/edit/${id}`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Xóa sản phẩm
  remove: (id) => {
    return axiosClient.delete(`/products/${id}`);
  },

  // CẬP NHẬT TRẠNG THÁI BIẾN THỂ (SIZE)
  updateVariantStatus: (variantId, status) => {
    return axiosClient.patch(
      `/products/variants/${variantId}/status`,
      {},
      {
        params: {
          status: status,
        },
      },
    );
  },
};

export default productService;
