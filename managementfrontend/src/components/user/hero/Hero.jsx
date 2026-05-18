import React from "react";
import { Link } from "react-router-dom";
// Import hình ảnh từ thư mục src/assets để Vite tối ưu hóa [cite: 264]
import coffeeCup from "../../../assets/hero/coffee-cup.svg";
import banhMi from "../../../assets/hero/banhmi.svg";
import "./Hero.css";

const Hero = () => {
  return (
    <section className="hero">
      <div className="main-content">
        <div className="body">
          <div className="hero-text">
            {/* Sử dụng font Tapestry cho tiêu đề [cite: 83, 140] */}
            <h1 className="hero-title">Cà Phê Đến Tận Tay</h1>
            <p className="hero-subtitle title-font">Nhanh và Tiện</p>
            <p className="hero-desc">
              Chỉ cần vài bước đặt hàng đơn giản, chúng tôi sẽ mang đến cho bạn
              ly cà phê thơm ngon, đậm vị, được giao tận nơi để bạn thưởng thức
              bất cứ lúc nào.
            </p>
            <Link to="/menu" className="btn hero-btn">
              Khám phá ngay
            </Link>
          </div>
          <div className="hero-image">
            <div className="coffee-wrap">
              <img src={coffeeCup} alt="Coffee Cup" className="coffee" />
              <img src={banhMi} alt="Bánh Mì" className="banhmi" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
