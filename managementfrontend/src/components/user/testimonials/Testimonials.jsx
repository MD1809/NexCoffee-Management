import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaStar, FaQuoteLeft, FaCheckCircle, FaHeart, FaCoffee } from "react-icons/fa";
import "./Testimonials.css";

const REVIEWS_DATA = [
  {
    id: 1,
    name: "Nguyễn Hải Đăng",
    role: "Product Designer • Khách hàng quen",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    rating: 5,
    tag: "Cà Phê Muối Kem Béo",
    category: "coffee",
    comment:
      "NexCoffee là trạm dừng chân quen thuộc mỗi sáng trước khi vào ca làm việc. Lớp kem muối béo mặn độc quyền hòa quyện tuyệt vời với espresso đậm đà. Không gian quán tone trầm ấm cúng, nhạc êm dịu, cực kỳ lý tưởng để tập trung sáng tạo.",
    date: "2 ngày trước",
    verified: true,
  },
  {
    id: 2,
    name: "Lê Phương Thảo",
    role: "Food Reviewer & Content Creator",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
    rating: 5,
    tag: "Cold Brew Cam Quế",
    category: "coldbrew",
    comment:
      "Điểm ấn tượng nhất là cách Barista tại NexCoffee chăm chút mẻ Cold Brew ủ 16 tiếng: vị chua thanh tự nhiên của Arabica Cầu Đất, hương quế thoang thoảng sảng khoái và hậu vị ngọt sâu. Phong cách phục vụ chỉn chu và thân thiện 10/10!",
    date: "5 ngày trước",
    verified: true,
  },
  {
    id: 3,
    name: "Trần Minh Quân",
    role: "Kiến trúc sư • Đặt hàng trực tuyến",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    rating: 5,
    tag: "Bạc Xỉu Sữa Dừa Hạnh Nhân",
    category: "coffee",
    comment:
      "Đặt giao hàng qua website mà cực kỳ hài lòng: shipper giao nhanh, đá để riêng trong túi giữ nhiệt chuyên dụng, món đến nơi vẫn vẹn nguyên hương vị và độ béo ngậy. Đây chắc chắn là quán cà phê yêu thích nhất của tôi tại Đà Nẵng.",
    date: "1 tuần trước",
    verified: true,
  },
  {
    id: 4,
    name: "Vũ Hoàng My",
    role: "Freelance Copywriter",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80",
    rating: 5,
    tag: "Không gian & Thái độ phục vụ",
    category: "service",
    comment:
      "Một không gian hiếm hoi vừa mang lại cảm giác bình yên của gỗ và hương cà phê mộc, vừa có wifi mạnh và nhiều góc ngồi riêng tư. Nhân viên luôn niềm nở đón khách và ghi nhớ khẩu vị giảm đường của mình.",
    date: "1 tuần trước",
    verified: true,
  },
];

const FILTER_TABS = [
  { key: "all", label: "Tất cả đánh giá (2.4k+)" },
  { key: "coffee", label: "Cà phê pha phin & Espresso" },
  { key: "coldbrew", label: "Cold Brew Thủ Công" },
  { key: "service", label: "Không gian & Dịch vụ" },
];

const Testimonials = () => {
  const [activeTab, setActiveTab] = useState("all");

  const filteredReviews =
    activeTab === "all"
      ? REVIEWS_DATA
      : REVIEWS_DATA.filter((item) => item.category === activeTab);

  return (
    <section className="testimonials-section" id="testimonials">
      <div className="main-content">
        {/* Section Header */}
        <div className="testimonials-head text-center">
          <div className="section-badge-light">
            <FaHeart className="badge-icon" />
            <span>Đánh Giá Từ Khách Hàng</span>
          </div>

          <h2 className="section-title-light title-font">
            Những Tách Cà Phê, Những Câu Chuyện Thật
          </h2>

          <p className="section-desc-light">
            Hơn 15.000+ lượt khách ghé thăm mỗi tháng và hàng ngàn phản hồi chân thành là động lực lớn nhất để chúng tôi hoàn thiện mỗi ngày.
          </p>

          {/* Social Proof Stats Bar */}
          <div className="testimonials-stats-bar">
            <div className="t-stat-item">
              <div className="t-stat-score">
                <span className="score-num">4.9</span>
                <div className="stars-row">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} className="star-gold" />
                  ))}
                </div>
              </div>
              <span className="t-stat-label">2,480+ Đánh giá 5 sao</span>
            </div>

            <div className="t-stat-divider" />

            <div className="t-stat-item">
              <span className="t-stat-highlight">15,000+</span>
              <span className="t-stat-label">Khách hàng hài lòng</span>
            </div>

            <div className="t-stat-divider" />

            <div className="t-stat-item">
              <span className="t-stat-highlight">98.8%</span>
              <span className="t-stat-label">Khách sẵn sàng quay lại</span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="testimonials-filters" role="tablist">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`filter-pill-btn ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Review Cards Grid */}
        <div className="reviews-grid">
          {filteredReviews.map((item) => (
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
                        <span className="verified-badge" title="Đã xác thực trải nghiệm">
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
                <span className="favorite-drink-pill">
                  <FaCoffee className="coffee-pill-icon" />
                  <span>{item.tag}</span>
                </span>
              </div>

              {/* Review Text */}
              <p className="review-comment">"{item.comment}"</p>

              {/* Card Footer */}
              <div className="review-card-footer">
                <span className="review-date">{item.date}</span>
                <span className="verified-text">Trải nghiệm thực tế</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Callout */}
        <div className="testimonials-bottom-banner">
          <div className="bottom-banner-text">
            <h4>Bạn Đã Trải Nghiệm NexCoffee Chưa?</h4>
            <p>
              Hãy để lại lời nhắn hoặc góp ý của bạn để cùng chúng tôi nâng tầm hương vị cà phê Việt mỗi ngày.
            </p>
          </div>
          <a href="#contact" className="btn-write-review">
            <span>Gửi Đánh Giá Của Bạn</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
