import axiosClient from "./axiosClient";

const categoryApi = {
  // Lấy danh sách category
  getAll: () => {
    return axiosClient.get("/categories");
  },

  // Lấy chi tiết 1 category
  getById: (id) => {
    return axiosClient.get(`/categories/${id}`);
  },

  // Tạo mới
  create: (data) => {
    return axiosClient.post("/categories", data);
  },

  // Cập nhật
  update: (id, data) => {
    return axiosClient.put(`/categories/${id}`, data);
  },

  // Xóa
  remove: (id) => {
    return axiosClient.delete(`/categories/${id}`);
  },

  // Cập nhật trạng thái (Patch)
  updateStatus: (id, statusData) => {
    return axiosClient.patch(`/categories/${id}/status`, statusData);
  },
};

export default categoryApi;
