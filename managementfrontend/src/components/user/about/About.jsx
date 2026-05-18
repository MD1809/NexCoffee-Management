import React from "react";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import aboutImage from "../../../assets/about/caphe1.svg";
import aboutImage1 from "../../../assets/about/logos_facebook.svg";
import aboutImage2 from "../../../assets/about/icons_instagram.svg";

import "./About.css";

const About = () => {
  return (
    <section className="about" id="about">
      <div className="main-content">
        <div className="body">
          <div className="about-image">
            <img src={aboutImage} alt="Về NexCoffee" />
          </div>
          <div className="about-content">
            <h2 className="about-title title-font">Về Chúng Tôi:</h2>
            <p className="about-desc">
              Chào mừng bạn đến với Coffee House - nơi chúng tôi mang đến những
              ly cà phê nguyên chất, thơm ngon từ hạt được chọn lọc kỹ lưỡng.
              Quán được tạo nên từ niềm đam mê với cà phê và mong muốn mang lại
              một không gian ấm cúng, nơi mọi người có thể gặp gỡ, trò chuyện
              hoặc đơn giản là tận hưởng khoảnh khắc bình yên.
              <br />
              <br />
              Sứ mệnh của chúng tôi là kết nối con người qua từng tách cà phê,
              với chất lượng và dịch vụ tận tâm.
            </p>
            <div className="about-info">
              <p className="title title-font">Theo dõi chúng tôi:</p>
              <div className="social-icons">
                <a href="#!" aria-label="Facebook">
                  <img
                    src={aboutImage1}
                    alt="Facebook"
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
              </div>
            </div>
            <a href="#contact" className="btn about-btn">
              Liên hệ
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
