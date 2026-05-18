import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../../components/user/header/Header";
import Footer from "../../components/user/footer/Footer";
const UserLayout = () => {
  return (
    <div className="user-portal">
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default UserLayout;
