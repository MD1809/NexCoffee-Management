import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

const sectionIds = ["hero", "about", "contact"];

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

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeSection, setActiveSection] = useState("hero");

  useEffect(() => {
    if (location.pathname === "/menu") {
      setActiveSection("menu");
      return;
    }

    if (location.pathname !== "/") {
      setActiveSection("");
      return;
    }

    const handleScroll = () => {
      const headerHeight =
        document.querySelector(".header-container")?.offsetHeight || 0;

      let currentSection = "hero";

      sectionIds.forEach((sectionId) => {
        const section = document.getElementById(sectionId);
        if (!section) return;

        const rect = section.getBoundingClientRect();

        if (rect.top - headerHeight <= 90) {
          currentSection = sectionId;
        }
      });

      setActiveSection(currentSection);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [location.pathname, location.hash]);

  const handleGoToSection = (sectionId) => {
    setActiveSection(sectionId);

    if (location.pathname !== "/") {
      navigate(`/#${sectionId}`);
      return;
    }

    scrollToSection(sectionId);
  };

  return (
    <nav className="nav-menu">
      <button
        type="button"
        className={activeSection === "hero" ? "active" : ""}
        onClick={() => handleGoToSection("hero")}
      >
        Trang chủ
      </button>

      <button
        type="button"
        className={activeSection === "about" ? "active" : ""}
        onClick={() => handleGoToSection("about")}
      >
        Giới thiệu
      </button>

      <NavLink
        to="/menu"
        className={({ isActive }) => (isActive ? "active" : "")}
      >
        Menu
      </NavLink>

      <button
        type="button"
        className={activeSection === "contact" ? "active" : ""}
        onClick={() => handleGoToSection("contact")}
      >
        Liên hệ
      </button>
    </nav>
  );
};

export default Navbar;
