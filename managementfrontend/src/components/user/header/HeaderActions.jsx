import React from "react";

import SearchButton from "./SearchButton";
import CartButton from "./CartButton";
import AccountOptions from "./AccountOptions";

const HeaderActions = () => {
  return (
    <div className="header-actions">
      <SearchButton />
      <CartButton />
      <AccountOptions />
    </div>
  );
};

export default HeaderActions;
