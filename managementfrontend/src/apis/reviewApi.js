import axiosInstance from "./axios";

// Gửi đánh giá cho một món trong đơn hàng
export const createReview = (reviewData) => {
  return axiosInstance.post("/reviews", reviewData);
};

// Lấy danh sách đánh giá của một đơn hàng cụ thể (để biết món nào đã review)
export const getOrderReviews = (orderId) => {
  return axiosInstance.get(`/reviews/order/${orderId}`);
};

// Lấy danh sách đánh giá tiêu biểu cho trang chủ Testimonials
export const getFeaturedReviews = (limit = 6) => {
  return axiosInstance.get(`/reviews/featured?limit=${limit}`);
};

// Lấy danh sách đánh giá của một sản phẩm
export const getProductReviews = (productId) => {
  return axiosInstance.get(`/reviews/product/${productId}`);
};
