import React from "react";
import { Link } from "react-router-dom";
import { FaStar, FaArrowRight, FaPlus } from "react-icons/fa";
import "./SignatureBrews.css";

// Dữ liệu 4 món Signature đặc trưng nhất của quán
const SIGNATURE_PRODUCTS = [
  {
    id: 1,
    name: "Cà Phê Muối Kem Béo",
    category: "Cà Phê Pha Phin",
    price: 39000,
    rating: 4.9,
    reviews: 142,
    badge: "Bán chạy nhất",
    description: "Espresso đậm đà hòa quyện cùng lớp kem muối biển béo ngậy độc quyền.",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: 2,
    name: "Bạc Xỉu Sữa Dừa Hạnh Nhân",
    category: "Cà Phê Sữa",
    price: 45000,
    rating: 5.0,
    reviews: 98,
    badge: "Mới ra mắt",
    description: "Cà phê phin truyền thống phối sữa dừa béo bùi và hạnh nhân lát giòn rụm.",
    image: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: 3,
    name: "Cold Brew Cam Quế Thủ Công",
    category: "Cà Phê Ủ Lạnh",
    price: 49000,
    rating: 4.8,
    reviews: 86,
    badge: "Thủ công",
    description: "Ủ lạnh 16 tiếng từ hạt Arabica Cầu Đất, thoang thoảng hương quế và cam vàng.",
    image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80"
  },
  {
    id: 4,
    name: "Trà Đào Cam Sả Thảo Mộc",
    category: "Trà Trái Cây",
    price: 42000,
    rating: 4.9,
    reviews: 115,
    badge: "Thanh nhiệt",
    description: "Trà đen nguyên bản kết hợp đào mọng nước và sả tươi thơm nồng sảng khoái.",
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80"
  }
];

const SignatureBrews = () => {
  return (
    <section className="signature-brews-section" id="signature-brews">
      <div className="main-content">
        {/* Header Section */}
        <div className="section-head text-center">
          <div className="section-badge-light">
            <span>✨ Thức Uống Đặc Trưng</span>
          </div>
          <h2 className="section-title-light title-font">
            Hương Vị Được Yêu Thích Nhất
          </h2>
          <p className="section-desc-light">
            Mỗi công thức là sự kết hợp tinh tế giữa nguyên liệu thượng hạng và kỹ thuật pha chế tâm huyết từ các Barista tại NexCoffee.
          </p>
        </div>

        {/* Product Cards Grid */}
        <div className="brews-grid">
          {SIGNATURE_PRODUCTS.map((item) => (
            <div key={item.id} className="brew-card">
              <div className="brew-image-wrap">
                <img src={item.image} alt={item.name} className="brew-image" loading="lazy" />
                <span className="brew-badge">{item.badge}</span>
              </div>

              <div className="brew-content">
                <div className="brew-meta">
                  <span className="brew-category">{item.category}</span>
                  <div className="brew-rating">
                    <FaStar className="star-icon" />
                    <span>{item.rating}</span>
                    <span className="rating-count">({item.reviews})</span>
                  </div>
                </div>

                <h3 className="brew-name">{item.name}</h3>
                <p className="brew-description">{item.description}</p>

                <div className="brew-footer">
                  <div className="brew-price">
                    {item.price.toLocaleString("vi-VN")} <span className="currency">đ</span>
                  </div>
                  <Link to="/menu" className="brew-add-btn" aria-label={`Đặt món ${item.name}`}>
                    <FaPlus className="add-icon" />
                    <span>Đặt Món</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="brews-cta-wrap">
          <Link to="/menu" className="btn-view-all-menu">
            <span>Khám Phá Toàn Bộ Thực Đơn</span>
            <FaArrowRight className="cta-icon" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default SignatureBrews;
