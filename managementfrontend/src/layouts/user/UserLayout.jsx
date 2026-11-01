import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../../components/user/header/Header";
import Footer from "../../components/user/footer/Footer";
import CartToast from "../../components/user/cart-toast/CartToast";
import CustomerChatWidget from "../../components/user/chatWidget/CustomerChatWidget";

const UserLayout = () => {
  return (
    <div className="user-portal">
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
      <CartToast />
      <CustomerChatWidget />
    </div>
  );
};

export default UserLayout;
