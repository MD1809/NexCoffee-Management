import React from "react";
import { Link } from "react-router-dom";

import logoNex from "../../../assets/logo/Logo.svg";

import Navbar from "./Navbar";
import HeaderActions from "./HeaderActions";
import SearchButton from "./SearchButton";
import "./Header.css";

const Header = () => {
  return (
    <header className="header-container">
      <div className="main-content header-wrap">
        <div className="logo">
          <Link to="/">
            <img src={logoNex} alt="NexCoffee" />
          </Link>
        </div>

        <Navbar />

        <div className="header-search-slot">
          <SearchButton />
        </div>

        <HeaderActions />
      </div>
    </header>
  );
};

export default Header;
