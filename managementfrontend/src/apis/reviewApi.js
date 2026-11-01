import axiosClient from "./axiosClient";

const unwrap = (response) => response?.data ?? response;

// Gửi đánh giá cho một món trong đơn hàng
export const createReview = async (reviewData) => {
  const response = await axiosClient.post("/reviews", reviewData);
  return unwrap(response);
};

// Chỉnh sửa đánh giá món ăn (mỗi đánh giá chỉ sửa được 1 lần duy nhất)
export const updateReview = async (reviewId, payload) => {
  const response = await axiosClient.put(`/reviews/${reviewId}`, payload);
  return unwrap(response);
};

// Lấy danh sách đánh giá của một đơn hàng cụ thể (để biết món nào đã review)
export const getOrderReviews = async (orderId) => {
  const response = await axiosClient.get(`/reviews/order/${orderId}`);
  return unwrap(response);
};

// Lấy danh sách đánh giá tiêu biểu cho trang chủ Testimonials
export const getFeaturedReviews = async (limit = 6) => {
  const response = await axiosClient.get(`/reviews/featured?limit=${limit}`);
  return unwrap(response);
};

// Lấy danh sách đánh giá của một sản phẩm
export const getProductReviews = async (productId) => {
  const response = await axiosClient.get(`/reviews/product/${productId}`);
  return unwrap(response);
};

// Lấy toàn bộ danh sách đánh giá khách hàng (hỗ trợ lọc rating, phân trang)
export const getAllReviews = async (rating = null, page = 0, size = 50) => {
  const params = new URLSearchParams();
  if (rating) params.append("rating", rating);
  params.append("page", page);
  params.append("size", size);
  const response = await axiosClient.get(`/reviews?${params.toString()}`);
  return unwrap(response);
};

// Admin: Lấy danh sách đánh giá kèm bộ lọc rating, status, keyword
export const getAdminReviews = async ({ rating = null, status = null, keyword = "" } = {}) => {
  const params = new URLSearchParams();
  if (rating) params.append("rating", rating);
  if (status) params.append("status", status);
  if (keyword && keyword.trim()) params.append("keyword", keyword.trim());
  const response = await axiosClient.get(`/admin/reviews?${params.toString()}`);
  return unwrap(response);
};

// Admin: Ẩn hoặc khôi phục nội dung đánh giá
export const toggleReviewStatus = async (reviewId, reason = "") => {
  const response = await axiosClient.put(`/admin/reviews/${reviewId}/toggle-status`, { reason });
  return unwrap(response);
};
