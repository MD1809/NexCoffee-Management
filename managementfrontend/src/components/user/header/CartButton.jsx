import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaShoppingCart } from "react-icons/fa";

import { getCart } from "../../../apis/cartApi";
import { AUTH_EVENTS } from "../../../utils/authStorage";

const CartButton = () => {
  const [cartCount, setCartCount] = useState(0);

  const loadCartCount = async () => {
    try {
      const response = await getCart();

      setCartCount(response?.totalQuantity || 0);
    } catch (error) {
      setCartCount(0);
    }
  };

  useEffect(() => {
    loadCartCount();

    const handleCartChanged = () => {
      loadCartCount();
    };

    window.addEventListener("cart-changed", handleCartChanged);
    window.addEventListener("storage", handleCartChanged);

    if (AUTH_EVENTS?.AUTH_CHANGED) {
      window.addEventListener(AUTH_EVENTS.AUTH_CHANGED, handleCartChanged);
    }

    return () => {
      window.removeEventListener("cart-changed", handleCartChanged);
      window.removeEventListener("storage", handleCartChanged);

      if (AUTH_EVENTS?.AUTH_CHANGED) {
        window.removeEventListener(AUTH_EVENTS.AUTH_CHANGED, handleCartChanged);
      }
    };
  }, []);

  return (
    <Link
      to="/cart"
      className="header-action-link header-cart-button"
      aria-label="Giỏ hàng"
    >
      <FaShoppingCart className="icon" />

      <span className="cart-count-badge">
        {cartCount > 99 ? "99+" : cartCount}
      </span>
    </Link>
  );
};

export default CartButton;
