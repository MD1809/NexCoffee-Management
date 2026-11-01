import React from "react";
import { FaFacebook, FaInstagram, FaLeaf, FaFire, FaHeart, FaArrowRight } from "react-icons/fa";
import aboutImage from "../../../assets/about/coffee-story.jpg";
import "./About.css";

const About = () => {
  return (
    <section className="about-section" id="about">
      <div className="main-content">
        <div className="about-grid">
          {/* Cột trái: Khung ảnh minh họa & Thẻ nổi */}
          <div className="about-visual">
            <div className="visual-card">
              <img src={aboutImage} alt="Hạt cà phê nguyên chất NexCoffee" className="visual-img" />
              <div className="experience-badge">
                <span className="exp-number">10+</span>
                <span className="exp-text">Năm Đam Mê Cà Phê Mộc</span>
              </div>
            </div>
          </div>

          {/* Cột phải: Nội dung câu chuyện & Cam kết */}
          <div className="about-narrative">
            <div className="section-badge-dark">
              <span>Câu Chuyện Thương Hiệu</span>
            </div>

            <h2 className="about-heading title-font">
              Hành Trình Tách Cà Phê <br />
              <span className="heading-highlight">Từ Nông Trại Đến Trái Tim</span>
            </h2>

            <p className="about-lead">
              Tại NexCoffee, chúng tôi tin rằng một tách cà phê ngon không đơn thuần là thức uống nạp năng lượng,
              mà là khoảnh khắc kết nối và đánh thức cảm hứng trong mỗi ngày mới.
            </p>

            <p className="about-paragraph">
              Khởi đầu từ những vùng đồi đất đỏ bazan tại Cầu Đất và Buôn Ma Thuột, chúng tôi đồng hành cùng các nông hộ
              bền vững để tuyển chọn từng quả cà phê chín mọng. Từng mẻ hạt được rang mộc tỉ mỉ bởi thợ rang lành nghề,
              giữ trọn vẹn tầng hương hoa quả thanh khiết và hậu vị ngọt sâu nguyên bản.
            </p>

            {/* 3 Cam kết cốt lõi */}
            <div className="about-commitments">
              <div className="commit-item">
                <div className="commit-icon-wrap">
                  <FaLeaf className="commit-icon" />
                </div>
                <div className="commit-body">
                  <h4 className="commit-title">100% Cà Phê Mộc</h4>
                  <p className="commit-desc">Tuyệt đối không pha tạp bắp, đậu hay hương liệu công nghiệp.</p>
                </div>
              </div>

              <div className="commit-item">
                <div className="commit-icon-wrap">
                  <FaFire className="commit-icon" />
                </div>
                <div className="commit-body">
                  <h4 className="commit-title">Rang Mới Mỗi Tuần</h4>
                  <p className="commit-desc">Kiểm soát nhiệt độ chuẩn xác, bảo đảm hạt đạt đỉnh cao hương thơm.</p>
                </div>
              </div>

              <div className="commit-item">
                <div className="commit-icon-wrap">
                  <FaHeart className="commit-icon" />
                </div>
                <div className="commit-body">
                  <h4 className="commit-title">Phục Vụ Tận Tâm</h4>
                  <p className="commit-desc">Mỗi ly cà phê đều được chăm chút kỹ lưỡng trước khi trao đến tay bạn.</p>
                </div>
              </div>
            </div>

            {/* Social & Contact Link */}
            <div className="about-actions-row">
              <a href="#contact" className="btn btn-about-contact">
                <span>Liên Hệ Với Chúng Tôi</span>
                <FaArrowRight className="action-icon" />
              </a>

              <div className="about-social-group">
                <span className="social-label">Theo dõi:</span>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook NexCoffee" className="social-link-btn">
                  <FaFacebook />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram NexCoffee" className="social-link-btn">
                  <FaInstagram />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
