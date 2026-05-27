// file: src/apis/userApi.js
import axiosClient from "./axiosClient";

const userApi = {
  // Lấy danh sách tất cả user
  getAll: () => {
    return axiosClient.get("/admin/users");
  },

  // Thêm user mới
  create: (data) => {
    return axiosClient.post("/admin/users", data);
  },

  // Cập nhật thông tin user
  update: (id, data) => {
    return axiosClient.put(`/admin/users/${id}`, data);
  },

  // Lấy danh sách shipper
  getShippers: () => {
    return axiosClient.get("/admin/users/shippers"); 
  }
};

export default userApi;