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
  },

  // Lấy chi tiết hồ sơ khách hàng (thống kê đơn hàng, đánh giá, chi tiêu)
  getCustomerDetail: (id) => {
    return axiosClient.get(`/admin/users/${id}/customer-detail`);
  },

  // Vô hiệu hóa tài khoản người dùng kèm lý do
  deactivate: (id, reason) => {
    return axiosClient.put(`/admin/users/${id}/deactivate`, { reason });
  },

  // Kích hoạt lại tài khoản người dùng
  reactivate: (id) => {
    return axiosClient.put(`/admin/users/${id}/reactivate`);
  },

  // Lấy danh sách hiệu suất nhân viên kèm các chỉ số KPI
  getStaffStats: (range = "TODAY") => {
    return axiosClient.get("/admin/users/staff-stats", { params: { range } });
  },

  // Lấy chi tiết nhân viên và các đơn hàng đã phụ trách
  getStaffDetail: (id, range = "TODAY") => {
    return axiosClient.get(`/admin/users/${id}/staff-detail`, { params: { range } });
  },
};

export default userApi;