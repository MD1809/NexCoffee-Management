import React from "react";
import { Link } from "react-router-dom";
import { FaLaptopCode, FaMapMarkedAlt, FaMotorcycle, FaArrowRight } from "react-icons/fa";
import StoreLocatorMap from "./StoreLocatorMap";
import "./StoreLocator.css";

const STORE_HIGHLIGHTS = [
  {
    id: 1,
    icon: <FaLaptopCode />,
    title: "Không Gian Làm Việc & Chill",
    description: "Bàn ghế công thái học êm ái, ổ cắm điện đầy đủ tại mọi góc ngồi, Wifi tốc độ cao và máy lạnh 24/7 lý tưởng cho công việc lẫn thư giãn.",
    tag: "Work & Meet"
  },
  {
    id: 2,
    icon: <FaMapMarkedAlt />,
    title: "Vị Trí Đắc Địa, Dễ Tiếp Cận",
    description: "Tọa lạc ngay các trục đường trung tâm sầm uất, bãi đỗ xe rộng rãi có bảo vệ, không gian thoáng đãng ngập tràn cây xanh và ánh sáng.",
    tag: "Prime Location"
  },
  {
    id: 3,
    icon: <FaMotorcycle />,
    title: "Giao Hàng Nhanh 20-30 Phút",
    description: "Quy trình đóng gói ly cách nhiệt chuyên dụng, đảm bảo lớp bọt kem sữa và hương vị cà phê luôn tươi mới nguyên vẹn khi đến tay bạn.",
    tag: "Fast Delivery"
  }
];

const StoreLocator = () => {
  return (
    <section className="store-locator-section" id="stores">
      <div className="main-content">
        {/* Header Section */}
        <div className="store-head text-center">
          <div className="section-badge-light">
            <span>📍 Không Gian & Giao Hàng</span>
          </div>
          <h2 className="section-title-light title-font">
            Trải Nghiệm Trọn Vẹn Cùng NexCoffee
          </h2>
          <p className="section-desc-light">
            Dù bạn muốn tìm một góc bình yên để thưởng thức ly cà phê sáng hay cần nạp năng lượng gấp tại văn phòng, chúng tôi luôn sẵn sàng phục vụ.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="store-features-grid">
          {STORE_HIGHLIGHTS.map((item) => (
            <div key={item.id} className="store-feature-card">
              <div className="feature-top">
                <div className="feature-icon-box">{item.icon}</div>
                <span className="feature-tag">{item.tag}</span>
              </div>
              <h3 className="feature-title">{item.title}</h3>
              <p className="feature-desc">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Bản đồ định vị các cửa hàng (Track Asia) */}
        <StoreLocatorMap />

        {/* Call-to-action Banner */}
        <div className="delivery-banner-card">
          <div className="banner-content">
            <h3 className="banner-title">Bạn muốn thưởng thức cà phê ngay tại nhà?</h3>
            <p className="banner-desc">
              Menu trực tuyến đầy đủ món kèm ưu đãi miễn phí giao hàng cho đơn từ 150.000đ.
            </p>
          </div>
          <div className="banner-actions">
            <Link to="/menu" className="btn-banner-primary">
              <span>Đặt Món Ngay</span>
              <FaArrowRight className="btn-icon" />
            </Link>
            <a href="#contact" className="btn-banner-outline">
              Liên Hệ Đặt Bàn
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StoreLocator;
