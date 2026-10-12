import React from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaCoffee, FaBolt, FaStar } from "react-icons/fa";
import coffeeCup from "../../../assets/hero/coffee-cup.svg";
import banhMi from "../../../assets/hero/banhmi.svg";
import "./Hero.css";

const Hero = () => {
  return (
    <section className="hero">
      <div className="main-content">
        <div className="hero-body">
          <div className="hero-text">
            {/* Tagline Badge */}
            <div className="hero-badge">
              <span className="badge-dot"></span>
              <span>Trải nghiệm Cà Phê Đặc Sản Việt Nam</span>
            </div>

            {/* Tiêu đề & phụ đề */}
            <h1 className="hero-title title-font">
              Đậm Đà Hương Vị, <br />
              <span className="hero-highlight">Đánh Thức Mọi Giác Quan</span>
            </h1>

            <p className="hero-desc">
              Từng hạt Robusta & Arabica hảo hạng được tuyển chọn khắt khe và rang mộc mỗi tuần. 
              Pha chế thủ công chuẩn vị, đóng gói tinh tế và giao nhanh tận nơi chỉ trong 20 phút.
            </p>

            {/* Nút hành động kép (Dual CTA) */}
            <div className="hero-actions">
              <Link to="/menu" className="btn hero-btn-primary">
                <span>Khám Phá Menu</span>
                <FaArrowRight className="btn-icon" />
              </Link>
              <a href="#stores" className="btn hero-btn-secondary">
                Tìm Quán Gần Bạn
              </a>
            </div>

            {/* Thống kê nhanh (Quick Stats) */}
            <div className="hero-stats">
              <div className="stat-card">
                <div className="stat-icon-wrap">
                  <FaCoffee className="stat-icon" />
                </div>
                <div className="stat-info">
                  <div className="stat-value">100%</div>
                  <div className="stat-label">Hạt Mộc Nguyên Chất</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrap">
                  <FaBolt className="stat-icon" />
                </div>
                <div className="stat-info">
                  <div className="stat-value">20 Phút</div>
                  <div className="stat-label">Giao Nhanh Tận Nơi</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrap">
                  <FaStar className="stat-icon star-color" />
                </div>
                <div className="stat-info">
                  <div className="stat-value">4.9 ★</div>
                  <div className="stat-label">10k+ Khách Hài Lòng</div>
                </div>
              </div>
            </div>
          </div>

          {/* Cột hình ảnh minh họa */}
          <div className="hero-image">
            <div className="coffee-glow-backdrop"></div>
            <div className="coffee-wrap">
              <img src={coffeeCup} alt="Ly Cà Phê NexCoffee" className="coffee" />
              <img src={banhMi} alt="Bánh Mì Tươi" className="banhmi" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
