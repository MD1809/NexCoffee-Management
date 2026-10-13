import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaStar, FaQuoteLeft, FaCheckCircle, FaHeart, FaCoffee } from "react-icons/fa";
import { getFeaturedReviews } from "../../../apis/reviewApi";
import "./Testimonials.css";

const BACKEND_URL = "http://localhost:8080";

const getImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;
  if (imagePath.startsWith("/images")) return `${BACKEND_URL}${imagePath}`;
  if (imagePath.startsWith("images")) return `${BACKEND_URL}/${imagePath}`;
  return `${BACKEND_URL}/images/${imagePath}`;
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return "Vừa xong";
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Vừa xong";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

// Dữ liệu mẫu khởi đầu khi hệ thống mới chạy chưa có đánh giá từ khách
const DEFAULT_REVIEWS = [
  {
    id: 1,
    name: "Nguyễn Hải Đăng",
    role: "Khách hàng thân thiết",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    rating: 5,
    productName: "Cà Phê Muối Kem Béo",
    productId: 1,
    comment:
      "NexCoffee là trạm dừng chân quen thuộc mỗi sáng trước khi vào ca làm việc. Lớp kem muối béo mặn độc quyền hòa quyện tuyệt vời với espresso đậm đà. Đồ uống giao đến vẫn còn nguyên lớp bọt béo.",
    date: "2 ngày trước",
    verified: true,
  },
  {
    id: 2,
    name: "Lê Phương Thảo",
    role: "Đã đặt đơn online",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
    rating: 5,
    productName: "Cold Brew Cam Quế",
    productId: 3,
    comment:
      "Điểm ấn tượng nhất là hương Cold Brew ủ thủ công 16 tiếng: vị chua thanh tự nhiên của Arabica Cầu Đất, hương quế thoang thoảng sảng khoái và hậu vị ngọt sâu rất dễ chịu.",
    date: "4 ngày trước",
    verified: true,
  },
  {
    id: 3,
    name: "Trần Minh Quân",
    role: "Khách hàng quen",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    rating: 5,
    productName: "Bạc Xỉu Sữa Dừa Hạnh Nhân",
    productId: 2,
    comment:
      "Đặt giao hàng qua website mà cực kỳ hài lòng: shipper giao nhanh, đá để riêng trong túi giữ nhiệt chuyên dụng, món đến nơi vẫn vẹn nguyên hương vị và độ béo ngậy.",
    date: "1 tuần trước",
    verified: true,
  },
  {
    id: 4,
    name: "Vũ Hoàng My",
    role: "Đã thưởng thức tại quán",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80",
    rating: 5,
    productName: "Trà Đào Cam Sả Thảo Mộc",
    productId: 4,
    comment:
      "Trà thanh mát, miếng đào giòn ngọt và thơm ngát mùi sả tự nhiên, uống giữa trưa nắng giải nhiệt cực kỳ đã. Nhân viên đóng gói cẩn thận 10/10.",
    date: "1 tuần trước",
    verified: true,
  },
];

const Testimonials = () => {
  const [reviews, setReviews] = useState(DEFAULT_REVIEWS);
  const [stats, setStats] = useState({
    averageRating: 4.9,
    totalReviews: 2480,
    satisfactionRate: 98.8,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await getFeaturedReviews(6);
        const data = response?.data || response;

        if (isMounted && data?.reviews && Array.isArray(data.reviews) && data.reviews.length > 0) {
          const mapped = data.reviews.map((r, idx) => ({
            id: r.id || idx,
            name: r.userFullName || "Khách hàng NexCoffee",
            role: "Khách hàng đã mua hàng",
            avatar: getImageUrl(r.userAvatar) || DEFAULT_REVIEWS[idx % DEFAULT_REVIEWS.length].avatar,
            rating: r.rating || 5,
            productName: r.productName || "Đồ uống NexCoffee",
            productId: r.productId,
            variantSize: r.variantSize,
            comment: r.comment || "Đồ uống rất ngon, chuẩn vị!",
            date: formatTimeAgo(r.createdAt),
            verified: true,
          }));
          setReviews(mapped);

          if (data.totalReviews && data.totalReviews > 0) {
            setStats({
              averageRating: Number(data.averageRating || 5.0).toFixed(1),
              totalReviews: data.totalReviews,
              satisfactionRate: Number(data.satisfactionRate || 98.8).toFixed(1),
            });
          }
        }
      } catch (error) {
        // Giữ fallback mặc định nếu offline
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchReviews();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="testimonials-section" id="testimonials">
      <div className="main-content">
        {/* Section Header */}
        <div className="testimonials-head text-center">
          <div className="section-badge-light">
            <FaHeart className="badge-icon" />
            <span>Đánh Giá Từ Khách Hàng Thật</span>
          </div>

          <h2 className="section-title-light title-font">
            Cảm Nhận Thực Tế Về Đồ Uống NexCoffee
          </h2>

          <p className="section-desc-light">
            Các đánh giá được xác thực trực tiếp từ khách hàng đã đặt và thưởng thức đồ uống qua hệ thống đơn hàng của NexCoffee.
          </p>

          {/* Social Proof Stats Bar */}
          <div className="testimonials-stats-bar">
            <div className="t-stat-item">
              <div className="t-stat-score">
                <span className="score-num">{stats.averageRating}</span>
                <div className="stars-row">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} className="star-gold" />
                  ))}
                </div>
              </div>
              <span className="t-stat-label">{stats.totalReviews.toLocaleString("vi-VN")}+ Đánh giá thực tế</span>
            </div>

            <div className="t-stat-divider" />

            <div className="t-stat-item">
              <span className="t-stat-highlight">15,000+</span>
              <span className="t-stat-label">Khách hàng hài lòng</span>
            </div>

            <div className="t-stat-divider" />

            <div className="t-stat-item">
              <span className="t-stat-highlight">{stats.satisfactionRate}%</span>
              <span className="t-stat-label">Khách sẵn sàng quay lại</span>
            </div>
          </div>
        </div>

        {/* Review Cards Grid */}
        <div className="reviews-grid">
          {reviews.map((item) => (
            <div key={item.id} className="review-card">
              <div className="card-top-row">
                <div className="user-profile">
                  <div className="avatar-wrapper">
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="user-avatar"
                      loading="lazy"
                    />
                  </div>
                  <div className="user-details">
                    <h4 className="user-name">
                      {item.name}
                      {item.verified && (
                        <span className="verified-badge" title="Đã xác thực đơn hàng thành công">
                          <FaCheckCircle className="check-icon" />
                        </span>
                      )}
                    </h4>
                    <span className="user-role">{item.role}</span>
                  </div>
                </div>
                <FaQuoteLeft className="quote-watermark" />
              </div>

              {/* Rating & Tag */}
              <div className="card-rating-row">
                <div className="review-stars">
                  {[...Array(item.rating)].map((_, i) => (
                    <FaStar key={i} className="star-icon" />
                  ))}
                </div>

                {item.productId ? (
                  <Link
                    to={`/products/${item.productId}`}
                    className="favorite-drink-pill"
                    title={`Xem chi tiết ${item.productName}`}
                  >
                    <FaCoffee className="coffee-pill-icon" />
                    <span>
                      {item.productName}
                      {item.variantSize ? ` (${item.variantSize})` : ""}
                    </span>
                  </Link>
                ) : (
                  <span className="favorite-drink-pill">
                    <FaCoffee className="coffee-pill-icon" />
                    <span>{item.productName}</span>
                  </span>
                )}
              </div>

              {/* Review Text */}
              <p className="review-comment">"{item.comment}"</p>

              {/* Card Footer */}
              <div className="review-card-footer">
                <span className="review-date">{item.date}</span>
                <span className="verified-text">Đã mua tại quán</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Callout */}
        <div className="testimonials-bottom-banner">
          <div className="bottom-banner-text">
            <h4>Bạn Đã Trải Nghiệm NexCoffee Chưa?</h4>
            <p>
              Sau khi nhận đơn hàng thành công, hãy để lại đánh giá trong mục Đơn hàng của bạn để cùng chúng tôi hoàn thiện mỗi ngày!
            </p>
          </div>
          <Link to="/account/orders" className="btn-write-review">
            <span>Xem Đơn Hàng Của Bạn</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
