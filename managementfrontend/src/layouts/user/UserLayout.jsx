import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../../components/user/header/Header";
import Footer from "../../components/user/footer/Footer";
import CartToast from "../../components/user/cart-toast/CartToast";
const UserLayout = () => {
  return (
    <div className="user-portal">
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
      <CartToast />
    </div>
  );
};

export default UserLayout;
