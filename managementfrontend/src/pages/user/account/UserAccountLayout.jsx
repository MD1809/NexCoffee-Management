import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { getCurrentUser } from "../../../utils/authStorage";
import "./UserAccount.css";

const UserAccountLayout = () => {
  const currentUser = getCurrentUser();

  return (
    <section className="user-account-section fade-in">
      <div className="main-content">
        <div className="user-account-wrap">
          <aside className="user-account-sidebar">
            <h3>TRANG TÀI KHOẢN</h3>
            <p>
              Xin chào,{" "}
              <strong>{currentUser?.fullName || currentUser?.email}</strong>!
            </p>

            <nav>
              <NavLink to="/account/orders">Đơn hàng của bạn</NavLink>
              <NavLink to="/account/password">Đổi mật khẩu</NavLink>
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
