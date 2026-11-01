import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaStar, FaQuoteLeft, FaCheckCircle, FaHeart, FaCoffee, FaStore } from "react-icons/fa";
import { getFeaturedReviews } from "../../../apis/reviewApi";
import SectionDivider from "../section-divider/SectionDivider";
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

const Testimonials = () => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    averageRating: "5.0",
    totalReviews: 0,
    satisfactionRate: "100",
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
            avatar: r.userAvatar ? getImageUrl(r.userAvatar) : null,
            rating: r.rating || 5,
            productName: r.productName || "Món ngon NexCoffee",
            productId: r.productId,
            variantSize: r.variantSize,
            comment: r.comment || "Món ăn/uống rất tươi ngon và tròn vị!",
            orderCreatedAt: r.orderCreatedAt,
            createdAt: r.createdAt,
            storeName: r.storeName || "NexCoffee",
            date: formatTimeAgo(r.createdAt),
            isEdited: Boolean(r.isEdited),
            verified: true,
          }));
          setReviews(mapped);

          if (data.totalReviews && data.totalReviews > 0) {
            setStats({
              averageRating: Number(data.averageRating || 5.0).toFixed(1),
              totalReviews: data.totalReviews,
              satisfactionRate: Number(data.satisfactionRate || 100).toFixed(1),
            });
          }
        } else if (isMounted) {
          setReviews([]);
        }
      } catch (error) {
        // Backend chưa kết nối hoặc lỗi mạng -> không dùng dữ liệu giả
        if (isMounted) {
          setReviews([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchReviews();
    return () => {
      isMounted = false;
    };
  }, []);

  // Nếu không có đánh giá thực tế từ backend, ẩn hoàn toàn section
  if (reviews.length === 0) {
    return null;
  }

  return (
    <>
      {/* Chuyển tiếp Tối -> Sáng từ Contact */}
      <SectionDivider type="dark-to-light" />

      <div id="testimonials" className="home-scroll-section section-light">
        <section className="testimonials-section">
          <div className="main-content">
            {/* Section Header */}
            <div className="testimonials-head text-center">
              <div className="section-badge-light">
                <FaHeart className="badge-icon" />
                <span>Đánh Giá Từ Khách Hàng Thật</span>
              </div>

              <h2 className="section-title-light title-font">
                Cảm Nhận Thực Tế Về Thực Đơn NexCoffee
              </h2>

              <p className="section-desc-light">
                Các đánh giá được xác thực trực tiếp từ khách hàng đã đặt và thưởng thức các món ăn, bánh ngọt và đồ uống qua hệ thống đơn hàng của NexCoffee.
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
                  <span className="t-stat-label">
                    {stats.totalReviews.toLocaleString("vi-VN")}+ Đánh giá thực tế
                  </span>
                </div>

                <div className="t-stat-divider" />

                <div className="t-stat-item">
                  <span className="t-stat-highlight">100%</span>
                  <span className="t-stat-label">Đơn hàng xác thực</span>
                </div>

                <div className="t-stat-divider" />

                <div className="t-stat-item">
                  <span className="t-stat-highlight">{stats.satisfactionRate}%</span>
                  <span className="t-stat-label">Khách hài lòng</span>
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
                        {item.avatar ? (
                          <img
                            src={item.avatar}
                            alt={item.name}
                            className="user-avatar"
                            loading="lazy"
                          />
                        ) : (
                          <div className="review-user-avatar-placeholder">
                            {(item.name || "U")[0]}
                          </div>
                        )}
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
                    <div className="testimonial-dates-wrap">
                      {item.orderCreatedAt && (
                        <span className="review-order-date">
                          Đặt: {new Date(item.orderCreatedAt).toLocaleDateString("vi-VN")}
                        </span>
                      )}
                      {item.orderCreatedAt && <span className="date-sep">•</span>}
                      <span className="review-date">Đánh giá: {item.date}</span>
                      {item.isEdited && (
                        <>
                          <span className="date-sep">•</span>
                          <span className="review-edited-tag">Đã chỉnh sửa</span>
                        </>
                      )}
                    </div>
                    <span className="verified-text" title={`Phục vụ bởi ${item.storeName || "NexCoffee"}`}>
                      <FaStore className="store-badge-icon" />
                      <span>{item.storeName || "NexCoffee"}</span>
                    </span>
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
      </div>

      {/* Chuyển tiếp Sáng -> Tối trước khi vào Footer */}
      <SectionDivider type="light-to-dark" flip={true} />
    </>
  );
};

export default Testimonials;
