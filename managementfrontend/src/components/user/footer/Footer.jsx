import React from "react";
import { Link } from "react-router-dom";
import { FaFacebook, FaInstagram, FaGithub } from "react-icons/fa";
import logoCoffee from "../../../assets/logo/Logo.svg";
import aboutImage1 from "../../../assets/about/logos_facebook.svg";
import aboutImage2 from "../../../assets/about/icons_instagram.svg";
import aboutImage3 from "../../../assets/about/devicon_github.svg";
import "./Footer.css";

const Footer = () => {
  const handleGoToSection = (sectionId) => {
    setActiveSection(sectionId);

    if (location.pathname !== "/") {
      navigate(`/#${sectionId}`);
      return;
    }

    scrollToSection(sectionId);
  };

  return (
    <footer className="footer fade-in">
      <div className="main-content">
        <div className="row">
          {/* Cột 1: Logo và Giới thiệu */}
          <div className="column1">
            <Link to="/">
              <img src={logoCoffee} alt="NexCoffee" />
            </Link>
            <p className="desc">
              Một quán coffee thành công không chỉ đến từ hương vị ly cà phê, mà
              còn từ cách bạn quản lý vận hành phía sau. Giải pháp của chúng tôi
              giúp bạn nắm bắt mọi thứ trong tầm tay, để mỗi ngày kinh doanh đều
              nhẹ nhàng và hiệu quả hơn.
            </p>
          </div>

          {/* Cột 2: Liên kết nhanh */}
          <div className="column2">
            <h3 className="title">Liên kết nhanh</h3>
            <ul>
              <li>
                <a href="/">Trang chủ</a>
              </li>
              <li>
                <Link to="/#about">Giới thiệu</Link>
              </li>
              <li>
                <Link to="/menu">Menu</Link>
              </li>
              <li>
                <Link to="/#contact">Liên hệ</Link>
              </li>
              <li>
                <Link to="/cart">Giỏ hàng</Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Thông tin liên hệ */}
          <div className="column3">
            <h3 className="title">Liên hệ</h3>
            <ul>
              <li>
                <a href="#!">
                  <strong>Địa chỉ:</strong> 123 Đường ABC, Quận 1, TP. Hồ Chí
                  Minh
                </a>
              </li>
              <li>
                <a href="mailto:caphengon.125@gmail.vn">
                  <strong>Email:</strong> caphengon.125@gmail.vn
                </a>
              </li>
              <li>
                <a href="tel:0909123456">
                  <strong>Hotline:</strong> 0909 123 456
                </a>
              </li>
            </ul>
          </div>

          {/* Cột 4: Mạng xã hội */}
          <div className="column4">
            <h3 className="title">Kết nối với chúng tôi</h3>
            <div className="social-links">
              <a href="#!" aria-label="Instagram">
                <img
                  src={aboutImage1}
                  alt="Instagram"
                  className="social-icon"
                />
              </a>
              <a href="#!" aria-label="Instagram">
                <img
                  src={aboutImage2}
                  alt="Instagram"
                  className="social-icon"
                />
              </a>
              <a href="#!" aria-label="Instagram">
                <img
                  src={aboutImage3}
                  alt="Instagram"
                  className="social-icon"
                />
              </a>
            </div>
          </div>
        </div>

        {/* Bản quyền */}
        <div className="copyright">
          <p>
            &copy; 2025 Coffee Manager | Thiết kế bởi Nhóm Quản Lý Quán Coffee
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
