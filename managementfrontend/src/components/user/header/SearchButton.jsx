import React from "react";
import { FaSearch } from "react-icons/fa";

const SearchButton = () => {
  const handleSearchClick = () => {
    // Sau này có thể mở search modal hoặc focus ô tìm kiếm
    console.log("Open search");
  };

  return (
    <button
      type="button"
      className="header-icon-button"
      aria-label="Tìm kiếm"
      onClick={handleSearchClick}
    >
      <FaSearch className="icon" />
    </button>
  );
};

export default SearchButton;
