import React, { useEffect, useRef, useState } from "react";
import { FaChevronDown, FaUserCircle } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { clearGuestCartToken } from "../../../utils/cartSession";

import {
  AUTH_EVENTS,
  clearAuth,
  getCurrentUser,
} from "../../../utils/authStorage";

const AccountOptions = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [openDropdown, setOpenDropdown] = useState(false);

  useEffect(() => {
    const syncCurrentUser = () => {
      setCurrentUser(getCurrentUser());
    };

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(false);
      }
    };

    window.addEventListener(AUTH_EVENTS.AUTH_CHANGED, syncCurrentUser);
    window.addEventListener("storage", syncCurrentUser);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener(AUTH_EVENTS.AUTH_CHANGED, syncCurrentUser);
      window.removeEventListener("storage", syncCurrentUser);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    clearAuth();

    // Xóa token giỏ guest để tránh giữ lại giỏ của user vừa đăng xuất
    clearGuestCartToken();

    window.dispatchEvent(new Event("cart-changed"));

    setOpenDropdown(false);

    toast.success("Đã đăng xuất.");
    navigate("/login", { replace: true });
  };

  if (!currentUser) {
    return (
      <Link to="/login" className="header-login-link">
        <FaUserCircle className="icon" />
        <span>Đăng nhập</span>
      </Link>
    );
  }

  return (
    <div className="header-user-menu" ref={dropdownRef}>
      <button
        type="button"
        className="header-user-button"
        onClick={() => setOpenDropdown((prev) => !prev)}
      >
        <span className="header-user-name">{currentUser.fullName}</span>

        <FaChevronDown
          className={`header-user-chevron ${openDropdown ? "is-open" : ""}`}
        />
      </button>

      {openDropdown && (
        <div className="header-user-dropdown">
          <Link
            to="/account"
            className="header-user-dropdown-item"
            onClick={() => setOpenDropdown(false)}
          >
            Tài khoản
          </Link>

          <button
            type="button"
            className="header-user-dropdown-item"
            onClick={handleLogout}
          >
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountOptions;
