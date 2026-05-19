import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./CartToast.css";

const defaultToast = {
  show: false,
  type: "success",
  title: "",
  message: "",
  productName: "",
  productImage: "",
  size: "",
  quantity: 1,
};

const CartToast = () => {
  const [toastData, setToastData] = useState(defaultToast);

  useEffect(() => {
    const handleShowCartToast = (event) => {
      setToastData({
        ...defaultToast,
        show: true,
        ...event.detail,
      });
    };

    window.addEventListener("cart-toast:show", handleShowCartToast);

    return () => {
      window.removeEventListener("cart-toast:show", handleShowCartToast);
    };
  }, []);

  const handleClose = () => {
    setToastData(defaultToast);
  };

  if (!toastData.show) return null;

  return (
    <div className="cart-toast-overlay" onClick={handleClose}>
      <div
        className="cart-toast-card"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={`toast-head ${toastData.type === "error" ? "error" : ""}`}
        >
          <span className="toast-title">
            {toastData.title || "Đã thêm vào giỏ hàng"}
          </span>

          <button
            type="button"
            className="toast-close"
            aria-label="Đóng"
            onClick={handleClose}
          >
            ×
          </button>
        </div>

        <div className="toast-body">
          <div className="row">
            {toastData.productImage ? (
              <img src={toastData.productImage} alt={toastData.productName} />
            ) : (
              <div className="cart-toast-placeholder">Nex</div>
            )}

            <div>
              <h4>{toastData.productName}</h4>

              {toastData.size && <p>Size: {toastData.size}</p>}

              <p>Số lượng: {toastData.quantity}</p>

              {toastData.message && <p>{toastData.message}</p>}
            </div>
          </div>
        </div>

        <div className="toast-actions">
          <Link className="toast-btn primary" to="/cart" onClick={handleClose}>
            Thanh toán
          </Link>

          <Link className="toast-btn" to="/cart" onClick={handleClose}>
            Xem giỏ hàng
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CartToast;
