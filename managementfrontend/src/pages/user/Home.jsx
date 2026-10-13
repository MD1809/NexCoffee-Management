import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";

import Hero from "../../components/user/hero/Hero";
import SignatureBrews from "../../components/user/signature-brews/SignatureBrews";
import About from "../../components/user/about/About";
import StoreLocator from "../../components/user/store-locator/StoreLocator";
import Contact from "../../components/user/contact/Contact";
import Testimonials from "../../components/user/testimonials/Testimonials";
import SectionDivider from "../../components/user/section-divider/SectionDivider";
import HomeAdPopup from "../../components/user/home-ad-popup/HomeAdPopup";
import "./Home.css";

const scrollToSection = (sectionId) => {
  const target = document.getElementById(sectionId);
  if (!target) return;

  const headerHeight =
    document.querySelector(".header-container")?.offsetHeight || 0;

  const targetTop =
    target.getBoundingClientRect().top + window.scrollY - headerHeight - 12;

  window.scrollTo({
    top: targetTop,
    behavior: "smooth",
  });
};

const Home = () => {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;

    const sectionId = location.hash.replace("#", "");

    const timer = setTimeout(() => {
      scrollToSection(sectionId);
    }, 80);

    return () => clearTimeout(timer);
  }, [location.hash]);

  return (
    <div className="home-page">
      {/* Popup quảng cáo trang chủ */}
      <HomeAdPopup />

      {/* Section 1: Hero (TỐI) */}
      <div id="hero" className="home-scroll-section section-dark">
        <Hero />
      </div>

      {/* Chuyển tiếp Tối -> Sáng */}
      <SectionDivider type="dark-to-light" />

      {/* Section 2: Signature Brews - Món nổi bật (SÁNG) */}
      <div id="signature-brews" className="home-scroll-section section-light">
        <SignatureBrews />
      </div>

      {/* Chuyển tiếp Sáng -> Tối */}
      <SectionDivider type="light-to-dark" flip={true} />

      {/* Section 3: About / Storytelling (TỐI) */}
      <div id="about" className="home-scroll-section section-dark">
        <About />
      </div>

      {/* Chuyển tiếp Tối -> Sáng */}
      <SectionDivider type="dark-to-light" />

      {/* Section 4: Store Locator & Giao Hàng (SÁNG) */}
      <div id="stores" className="home-scroll-section section-light">
        <StoreLocator />
      </div>

      {/* Chuyển tiếp Sáng -> Tối */}
      <SectionDivider type="light-to-dark" flip={true} />

      {/* Section 5: Contact - Liên hệ & Gửi tin nhắn (TỐI) */}
      <div id="contact" className="home-scroll-section section-dark">
        <Contact />
      </div>

      {/* Chuyển tiếp Tối -> Sáng */}
      <SectionDivider type="dark-to-light" />

      {/* Section 6: Testimonials - Đánh giá từ khách hàng (SÁNG) */}
      <div id="testimonials" className="home-scroll-section section-light">
        <Testimonials />
      </div>

      {/* Chuyển tiếp Sáng -> Tối trước khi vào Footer */}
      <SectionDivider type="light-to-dark" flip={true} />
    </div>
  );
};

export default Home;
