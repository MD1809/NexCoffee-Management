import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";

import Hero from "../../components/user/hero/Hero";
import About from "../../components/user/about/About";
import Contact from "../../components/user/contact/Contact";
import HomeAdPopup from "../../components/user/home-ad-popup/HomeAdPopup";

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
      <HomeAdPopup />
      <div id="hero" className="home-scroll-section">
        <Hero />
      </div>

      <div id="about" className="home-scroll-section">
        <About />
      </div>

      <div id="contact" className="home-scroll-section">
        <Contact />
      </div>
    </div>
  );
};

export default Home;
