import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { FaSun, FaMoon, FaBars } from "react-icons/fa";
import { getCurrentUser, AUTH_EVENTS } from "../../utils/authStorage";

import "./AdminLayout.css";
import NavSidebar from "../../components/admin/navSidebar/NavSidebar";
import AccountOptions from "../../components/user/header/AccountOptions";

function AdminLayout() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const savedState = localStorage.getItem("isSidebarOpen");
    return savedState === "false" ? false : true;
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  useEffect(() => {
    localStorage.setItem("isSidebarOpen", isSidebarOpen);
  }, [isSidebarOpen]);

  useEffect(() => {
    const handleAuthChanged = () => {
      setCurrentUser(getCurrentUser());
    };

    window.addEventListener(AUTH_EVENTS.AUTH_CHANGED, handleAuthChanged);
    window.addEventListener("storage", handleAuthChanged);

    return () => {
      window.removeEventListener(AUTH_EVENTS.AUTH_CHANGED, handleAuthChanged);
      window.removeEventListener("storage", handleAuthChanged);
    };
  }, []);

  function ToggleSidebar() {
    setIsSidebarOpen((prev) => !prev);
  }

  const storeDisplayName =
    currentUser?.storeName ||
    (currentUser?.role === "SUPER_ADMIN"
      ? "Toàn hệ thống"
      : "Chưa gán cửa hàng");
  return (
    <div className={`admin-container ${isSidebarOpen ? "" : "sidebar-closed"}`}>
      <NavSidebar isOpen={isSidebarOpen} />

      <div className="admin-main">
        <header className="admin-main__header">
          <div className="header__left">
            <FaBars className="toggle-sidebar" onClick={ToggleSidebar} />
          </div>
          <div className="header_right">
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              data-tooltip={theme === "dark" ? "Chế độ Sáng" : "Chế độ Tối"}
            >
              {theme === "dark" ? (
                <FaSun size={20} color="#f1c40f" />
              ) : (
                <FaMoon size={20} color="#2c3e50" />
              )}
            </button>

            <div className="admin-header-store" title={storeDisplayName}>
              <span className="admin-header-store__label">Cửa hàng</span>
              <span className="admin-header-store__name">
                {storeDisplayName}
              </span>
            </div>

            <AccountOptions variant="admin" accountPath="/admin" />
          </div>
        </header>
        <main className="admin-main__body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
