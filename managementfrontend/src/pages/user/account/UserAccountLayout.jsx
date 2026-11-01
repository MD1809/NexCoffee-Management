import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  FaShoppingBag,
  FaStar,
  FaKey,
  FaArrowLeft,
  FaUserShield,
} from "react-icons/fa";
import { getCurrentUser } from "../../../utils/authStorage";
import "./UserAccount.css";

const UserAccountLayout = () => {
  const currentUser = getCurrentUser();
  const displayName = currentUser?.fullName || currentUser?.email || "Khách hàng";

  return (
    <section className="user-account-section fade-in">
      <div className="main-content">
        <div className="user-account-wrap">
          {/* Cột Account Options bên trái: phân cách bằng 1 border bên phải giống trang Menu, không bo góc */}
          <aside className="user-account-sidebar">
            <div className="user-account-profile-box">
              <span className="profile-greeting">Tài khoản</span>
              <h3 className="profile-name" title={displayName}>
                {displayName}
              </h3>
              <span className="profile-badge">
                <FaUserShield className="badge-icon" /> Khách hàng NexCoffee
              </span>
            </div>

            <nav className="user-account-nav">
              <NavLink
                to="/account/orders"
                className={({ isActive }) =>
                  isActive ? "nav-item active" : "nav-item"
                }
              >
                <FaShoppingBag className="nav-icon" />
                <span>Đơn hàng của bạn</span>
              </NavLink>

              <NavLink
                to="/account/reviews"
                className={({ isActive }) =>
                  isActive ? "nav-item active" : "nav-item"
                }
              >
                <FaStar className="nav-icon" />
                <span>Đánh giá của khách hàng</span>
              </NavLink>

              <NavLink
                to="/account/password"
                className={({ isActive }) =>
                  isActive ? "nav-item active" : "nav-item"
                }
              >
                <FaKey className="nav-icon" />
                <span>Đổi mật khẩu</span>
              </NavLink>

              <NavLink to="/menu" className="nav-item nav-item-back">
                <FaArrowLeft className="nav-icon" />
                <span>Khám phá thực đơn</span>
              </NavLink>
            </nav>
          </aside>

          <main className="user-account-content">
            <Outlet />
          </main>
        </div>
      </div>
    </section>
  );
};

export default UserAccountLayout;
